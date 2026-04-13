const Company = require('../models/Company');
const Experience = require('../models/Experience');

// GET /companies -> list all companies
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    
    // Add experience count and metadata for each company
    const companiesWithCount = await Promise.all(companies.map(async (company) => {
      const stats = await Experience.aggregate([
        { $match: { companyId: company._id } },
        { $group: { 
          _id: null, 
          count: { $sum: 1 },
          mostRecentBatch: { $max: "$batch" },
          representativeRole: { $first: "$role" },
          representativeCtc: { $first: "$ctc" }
        }}
      ]);

      const result = stats[0] || { count: 0, mostRecentBatch: "2025", representativeRole: "SDE", representativeCtc: "Role Based" };

      return {
        ...company.toObject(),
        experienceCount: result.count,
        representativeBatch: result.mostRecentBatch,
        representativeRole: result.representativeRole,
        representativeCtc: result.representativeCtc
      };
    }));

    res.status(200).json(companiesWithCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /companies/:id/roles -> return roles + count
exports.getCompanyRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const experiences = await Experience.find({ companyId: id });
    
    // Dynamically aggregate roles
    const roles = experiences.reduce((acc, exp) => {
      acc[exp.role] = (acc[exp.role] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /experiences?companyId=&role= -> filter experiences
exports.getExperiences = async (req, res) => {
  try {
    const { companyId, role, selected, difficulty, batch, sort } = req.query;
    
    let query = {};
    if (companyId) query.companyId = companyId;
    if (role) {
      query.role = { $regex: new RegExp(role.trim(), 'i') };
    }
    if (batch) query.batch = batch;
    if (selected !== undefined) query.selected = selected === 'true';
    if (difficulty) query.difficulty = difficulty;
    
    let sortOption = { createdAt: -1 };
    if (sort === 'upvotes') sortOption = { upvotes: -1 };

    const experiences = await Experience.find(query).sort(sortOption);
    res.status(200).json(experiences);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    const { roundNumber, overview, questions, ...otherData } = req.body;
    
    if (roundNumber !== undefined) {
      const experience = await Experience.findById(req.params.id);
      if (!experience) return res.status(404).json({ message: 'Experience not found' });
      
      const roundIndex = experience.rounds.findIndex(r => r.roundNumber === Number(roundNumber));
      if (roundIndex !== -1) {
        // Update specific round fields
        experience.rounds[roundIndex].notes = Array.isArray(overview) ? overview : [overview];
        experience.rounds[roundIndex].questions = questions;
        
        // Save and return
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
