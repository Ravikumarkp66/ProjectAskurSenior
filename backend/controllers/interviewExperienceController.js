const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const Experience = require('../models/Experience');
const Admin = require('../models/Admin');
const { logActivity } = require('../services/adminActivityService');

const escapeRegExp = (str) => str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

// Helper to resolve admin from request or token without failing public routes.
// SECURITY: Student tokens carry role='student'. They must NOT be treated as admin
// even if their email coincidentally exists in the Admin collection.
const resolveAdminFromToken = async (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : (req.query?.token || null);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_ask_ur_senior');

    // 1. If the token explicitly has role='student', it is strictly a student token!
    if (decoded.role === 'student') return null;

    // 2. If req.admin is already verified by admin middleware
    if (req.admin && req.admin.status === 'ACTIVE') return req.admin;

    // 3. Admin lookup by adminId, isAdmin claim, or email
    const tokenEmail = (decoded.email || '').toLowerCase().trim();
    if (decoded.adminId || decoded.isAdmin || tokenEmail) {
      const admin = await Admin.findOne(
        decoded.adminId ? { _id: decoded.adminId } : { email: tokenEmail }
      ).populate('department');
      if (admin && admin.status === 'ACTIVE') {
        return admin;
      }
    }
  } catch (_) {}
  return null;
};

// GET /companies -> list all companies
exports.getCompanies = async (req, res) => {
  try {
    const admin = await resolveAdminFromToken(req);
    const isAdmin = !!admin;

    const companyQuery = isAdmin ? {} : { status: { $ne: 'Inactive' } };
    const companies = await Company.find(companyQuery).lean();
    
    // Aggregate experience stats: public view only counts Published experiences
    const statsMap = new Map();
    try {
      const matchStage = isAdmin ? {} : { status: { $in: ['Published', null] } };
      const allStats = await Experience.aggregate([
        { $match: matchStage },
        {
          $group: { 
            _id: "$companyId", 
            count: { $sum: 1 },
            mostRecentBatch: { $max: "$batch" },
            representativeRole: { $first: "$role" },
            representativeCtc: { $first: "$ctc" }
          }
        }
      ]);
      allStats.forEach(s => {
        if (s._id) statsMap.set(s._id.toString(), s);
      });
    } catch (aggErr) {
      console.error('Aggregation error in getCompanies:', aggErr.message);
    }

    const companiesWithCount = companies.map((company) => {
      const s = statsMap.get(company._id.toString()) || {};
      return {
        ...company,
        status: company.status || 'Active',
        isActive: company.isActive !== false && company.status !== 'Inactive',
        experienceCount: s.count || 0,
        representativeBatch: s.mostRecentBatch || "2025",
        representativeRole: s.representativeRole || "SDE",
        representativeCtc: s.representativeCtc || "Role Based"
      };
    });

    res.status(200).json(companiesWithCount);
  } catch (error) {
    console.error('Error in getCompanies:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch companies' });
  }
};

// GET /companies/:id/roles -> return roles + count
exports.getCompanyRoles = async (req, res) => {
  try {
    const { id } = req.params;
    let targetCompanyId = id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const comp = await Company.findOne({
        $or: [
          { name: new RegExp('^' + escapeRegExp((id || '').replace(/-/g, ' ')) + '$', 'i') },
          { name: new RegExp('^' + escapeRegExp(id) + '$', 'i') }
        ]
      }).lean();
      if (comp) {
        targetCompanyId = comp._id;
      } else {
        return res.status(200).json({});
      }
    }

    const admin = await resolveAdminFromToken(req);
    const query = { companyId: targetCompanyId };
    if (!admin) {
      query.status = { $in: ['Published', null] };
    }

    const experiences = await Experience.find(query).lean();
    
    // Dynamically aggregate roles
    const roles = experiences.reduce((acc, exp) => {
      if (exp.role) {
        acc[exp.role] = (acc[exp.role] || 0) + 1;
      }
      return acc;
    }, {});

    res.status(200).json(roles);
  } catch (error) {
    console.error('Error in getCompanyRoles:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch company roles' });
  }
};

// GET /experiences?companyId=&role= -> filter experiences
// Public/Students: Published only
// Admins: Can filter by status (Pending, Published, Rejected, Archived, all)
exports.getExperiences = async (req, res) => {
  try {
    const { companyId, role, selected, difficulty, batch, sort, status } = req.query;
    const admin = await resolveAdminFromToken(req);
    const isAdmin = !!admin;
    
    let query = {};

    // Status filtering: Enforce Published for public/students
    if (!isAdmin) {
      query.status = { $in: ['Published', null] };
    } else if (status && status !== 'all') {
      query.status = status;
    }

    if (companyId) {
      if (mongoose.Types.ObjectId.isValid(companyId)) {
        query.companyId = companyId;
      } else {
        const comp = await Company.findOne({
          $or: [
            { name: new RegExp('^' + escapeRegExp(companyId.replace(/-/g, ' ')) + '$', 'i') },
            { name: new RegExp('^' + escapeRegExp(companyId) + '$', 'i') }
          ]
        }).lean();
        if (comp) {
          query.companyId = comp._id;
        } else {
          return res.status(200).json([]);
        }
      }
    }

    if (role) {
      query.role = { $regex: new RegExp(escapeRegExp(role.trim()), 'i') };
    }
    if (batch) query.batch = batch;
    if (selected !== undefined) query.selected = selected === 'true';
    if (difficulty) query.difficulty = difficulty;
    
    let sortOption = { createdAt: -1 };
    if (sort === 'upvotes') sortOption = { upvotes: -1 };

    const experiences = await Experience.find(query).populate('companyId', 'name logo type cutoff').sort(sortOption).lean();
    res.status(200).json(experiences);
  } catch (error) {
    console.error('Error in getExperiences:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch experiences' });
  }
};

// POST /experiences -> add new experience (Student submissions default to Pending, Admin defaults to Published)
exports.createExperience = async (req, res) => {
  try {
    // Use resolveAdminFromToken exclusively — it verifies the Admin collection + ACTIVE status.
    // Do NOT fall back to req.isAdmin/req.user flags: auth.js may set req.isAdmin=true for
    // student accounts whose email coincidentally matches an Admin record.
    const admin = await resolveAdminFromToken(req);
    const isAdmin = !!admin;
    // Students always get status=Pending regardless of what they send in the body.
    // Admins default to Published but can override via req.body.status.
    const initialStatus = isAdmin ? (req.body.status || 'Published') : 'Pending';

    const experienceData = {
      ...req.body,
      status: initialStatus
    };

    if (req.user?._id) {
      experienceData.user = req.user._id;
      if (!experienceData.author && !experienceData.isAnonymous) {
        experienceData.author = req.user.name || 'Anonymous Senior';
      }
    }

    const experience = new Experience(experienceData);
    await experience.save();

    if (isAdmin) {
      await logActivity({
        req,
        action: 'CREATE',
        resourceType: 'EXPERIENCE',
        resourceId: experience._id,
        metadata: { companyId: experience.companyId, role: experience.role, status: experience.status }
      });
    }

    res.status(201).json(experience);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST /experiences/:id/upvote -> increment upvote
exports.upvoteExperience = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Experience not found' });
    }
    const experience = await Experience.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    if (!experience) return res.status(404).json({ message: 'Experience not found' });
    res.status(200).json(experience);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /experiences/:id -> update experience (Admin)
exports.updateExperience = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Experience not found' });
    }
    const { roundNumber, overview, questions } = req.body;
    
    if (roundNumber !== undefined) {
      const experience = await Experience.findById(req.params.id);
      if (!experience) return res.status(404).json({ message: 'Experience not found' });
      
      const roundIndex = experience.rounds.findIndex(r => r.roundNumber === Number(roundNumber));
      if (roundIndex !== -1) {
        experience.rounds[roundIndex].notes = Array.isArray(overview) ? overview : [overview];
        experience.rounds[roundIndex].questions = questions;
        await experience.save();

        await logActivity({
          req,
          action: 'UPDATE',
          resourceType: 'EXPERIENCE',
          resourceId: experience._id,
          metadata: { company: experience.company, role: experience.role, round: roundNumber }
        });

        return res.status(200).json(experience);
      }
    }

    const experience = await Experience.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!experience) return res.status(404).json({ message: 'Experience not found' });

    await logActivity({
      req,
      action: 'UPDATE',
      resourceType: 'EXPERIENCE',
      resourceId: experience._id,
      metadata: { company: experience.company, role: experience.role, status: experience.status }
    });

    res.status(200).json(experience);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /experiences/:id/status -> moderate experience status (Admin: approve/publish, reject, archive)
exports.updateExperienceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['Pending', 'Published', 'Rejected', 'Archived'].includes(status)) {
      return res.status(400).json({
        message: "Status must be one of 'Pending', 'Published', 'Rejected', 'Archived'"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    const experience = await Experience.findById(id);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    experience.status = status;
    await experience.save();

    let action = 'UPDATE';
    if (status === 'Published') action = 'PUBLISH';
    else if (status === 'Rejected') action = 'REJECT';
    else if (status === 'Archived') action = 'ARCHIVE';

    await logActivity({
      req,
      action,
      resourceType: 'EXPERIENCE',
      resourceId: experience._id,
      metadata: { company: experience.company, role: experience.role, status, reason: reason || null }
    });

    return res.status(200).json({
      success: true,
      message: `Experience status updated to ${status}`,
      data: experience
    });
  } catch (error) {
    console.error('Error updating experience status:', error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE /experiences/:id -> archive experience (Soft delete)
exports.deleteExperience = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    const experience = await Experience.findById(id);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    experience.status = 'Archived';
    await experience.save();

    await logActivity({
      req,
      action: 'ARCHIVE',
      resourceType: 'EXPERIENCE',
      resourceId: experience._id,
      metadata: { company: experience.company, role: experience.role, status: 'Archived' }
    });

    return res.status(200).json({
      success: true,
      message: 'Experience archived successfully',
      data: experience
    });
  } catch (error) {
    console.error('Error archiving experience:', error);
    res.status(500).json({ message: error.message });
  }
};

// FOR ADMIN: POST /companies -> add new company
exports.createCompany = async (req, res) => {
  try {
    const company = new Company({
      ...req.body,
      status: req.body.status || 'Active',
      isActive: req.body.status ? req.body.status === 'Active' : true
    });
    await company.save();

    await logActivity({
      req,
      action: 'CREATE',
      resourceType: 'COMPANY',
      resourceId: company._id,
      metadata: { name: company.name, industry: company.industry }
    });

    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// FOR ADMIN: PUT /admin/companies/:id -> update company
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const { name, logo, industry, website, description, status, isActive } = req.body;
    if (name !== undefined) company.name = name.trim();
    if (logo !== undefined) company.logo = logo;
    if (industry !== undefined) company.industry = industry;
    if (website !== undefined) company.website = website;
    if (description !== undefined) company.description = description;

    if (status !== undefined) {
      company.status = status;
      company.isActive = status === 'Active';
    } else if (isActive !== undefined) {
      company.isActive = !!isActive;
      company.status = isActive ? 'Active' : 'Inactive';
    }

    await company.save();

    await logActivity({
      req,
      action: 'UPDATE',
      resourceType: 'COMPANY',
      resourceId: company._id,
      metadata: { name: company.name, status: company.status }
    });

    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FOR ADMIN: DELETE /admin/companies/:id -> deactivate if experiences exist, else remove
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const experienceCount = await Experience.countDocuments({ companyId: company._id });

    if (experienceCount > 0) {
      company.status = 'Inactive';
      company.isActive = false;
      await company.save();

      await logActivity({
        req,
        action: 'DISABLE',
        resourceType: 'COMPANY',
        resourceId: company._id,
        metadata: { name: company.name, reason: 'Deactivated due to existing experiences', experienceCount }
      });

      return res.status(200).json({
        success: true,
        message: 'Company has associated interview experiences and was deactivated instead of deleted',
        data: company,
        deactivated: true
      });
    }

    await Company.findByIdAndDelete(company._id);

    await logActivity({
      req,
      action: 'DELETE',
      resourceType: 'COMPANY',
      resourceId: company._id,
      metadata: { name: company.name }
    });

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
