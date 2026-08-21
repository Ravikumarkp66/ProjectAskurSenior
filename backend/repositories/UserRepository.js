const BaseRepository = require('./BaseRepository');
const User = require('../models/User');
const StudentAccount = require('../models/StudentAccount');

class UserRepository extends BaseRepository {
    constructor() {
        super(User);
        this.studentAccountModel = StudentAccount;
    }

    async findByUsn(usn) {
        return this.findOne({ usn: usn.toUpperCase() });
    }

    async findByEmail(email) {
        return this.findOne({ email: email.toLowerCase() });
    }

    async findStudentAccountByEmail(email) {
        return this.studentAccountModel.findOne({ email: email.toLowerCase() });
    }

    async findStudentAccountById(id) {
        return this.studentAccountModel.findById(id);
    }
}

module.exports = new UserRepository();
