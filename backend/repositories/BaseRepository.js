/**
 * BaseRepository
 * Generic Data Access Layer abstraction for Mongoose models.
 */
class BaseRepository {
    /**
     * @param {import('mongoose').Model} model - Mongoose model instance
     */
    constructor(model) {
        if (!model) {
            throw new Error('Mongoose model is required for Repository instantiation');
        }
        this.model = model;
    }

    async find(filter = {}, projection = null, options = {}) {
        return this.model.find(filter, projection, options);
    }

    async findOne(filter = {}, projection = null, options = {}) {
        return this.model.findOne(filter, projection, options);
    }

    async findById(id, projection = null, options = {}) {
        return this.model.findById(id, projection, options);
    }

    async create(data) {
        return this.model.create(data);
    }

    async updateById(id, updateData, options = { new: true }) {
        return this.model.findByIdAndUpdate(id, updateData, options);
    }

    async updateOne(filter, updateData, options = {}) {
        return this.model.updateOne(filter, updateData, options);
    }

    async updateMany(filter, updateData, options = {}) {
        return this.model.updateMany(filter, updateData, options);
    }

    async deleteById(id) {
        return this.model.findByIdAndDelete(id);
    }

    async deleteMany(filter) {
        return this.model.deleteMany(filter);
    }

    async countDocuments(filter = {}) {
        return this.model.countDocuments(filter);
    }
}

module.exports = BaseRepository;
