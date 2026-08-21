const mongoose = require('mongoose');
const Company = require('../models/Company');
const Experience = require('../models/Experience');

const escapeRegExp = (str) => str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

// GET /companies -> list all companies
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().lean();
    
    // Single aggregation query across all companies to prevent N+1 query overhead
    const statsMap = new Map();
    try {
      const allStats = await Experience.aggregate([
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

    const experiences = await Experience.find({ companyId: targetCompanyId }).lean();
    
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
exports.getExperiences = async (req, res) => {
  try {
    const { companyId, role, selected, difficulty, batch, sort } = req.query;
    
    let query = {};
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

    const experiences = await Experience.find(query).sort(sortOption).lean();
    res.status(200).json(experiences);
  } catch (error) {
    console.error('Error in getExperiences:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch experiences' });
  }
};

// POST /experiences -> add new experience
exports.createExperience = async (req, res) => {
  try {
    const experience = new Experience(req.body);
    await experience.save();
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
        return res.status(200).json(experience);
      }
    }

    const experience = await Experience.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!experience) return res.status(404).json({ message: 'Experience not found' });
    res.status(200).json(experience);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FOR ADMIN: POST /companies -> add new company
exports.createCompany = async (req, res) => {
  try {
    const company = new Company(req.body);
    await company.save();
    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
