const StudentAccount = require('../../../models/StudentAccount');
const AcademicProfile = require('../../../models/AcademicProfile');

class StudentAccountRepository {
    async findByEmail(email, traceId = 'internal') {
        if (!email) return null;
        console.log(`[V2 Repository][${traceId}] Querying StudentAccount collection by email: "${email}"`);
        const student = await StudentAccount.findOne({ email: email.toLowerCase().trim(), isDeleted: false })
            .populate('branch')
            .populate('scheme');
        if (student) {
            console.log(`[V2 Repository][${traceId}] MATCH FOUND in student_accounts, _id: ${student._id}, Email: "${student.email}"`);
            student.academicProfile = await AcademicProfile.findOne({ student: student._id });
        } else {
            console.log(`[V2 Repository][${traceId}] NO MATCH FOUND in student_accounts for email: "${email}"`);
        }
        return student;
    }

    async findByUsn(usn, traceId = 'internal') {
        if (!usn) return null;
        console.log(`[V2 Repository][${traceId}] Querying StudentAccount collection by USN: "${usn}"`);
        const student = await StudentAccount.findOne({ usn: usn.toUpperCase().trim(), isDeleted: false })
            .populate('branch')
            .populate('scheme');
        if (student) {
            console.log(`[V2 Repository][${traceId}] MATCH FOUND in student_accounts, _id: ${student._id}, USN: "${student.usn}"`);
            student.academicProfile = await AcademicProfile.findOne({ student: student._id });
        } else {
            console.log(`[V2 Repository][${traceId}] NO MATCH FOUND in student_accounts for USN: "${usn}"`);
        }
        return student;
    }

    async findById(id, traceId = 'internal') {
        if (!id) return null;
        console.log(`[V2 Repository][${traceId}] Querying StudentAccount collection by ID: "${id}"`);
        const student = await StudentAccount.findById(id)
            .populate('branch')
            .populate('scheme');
        if (student) {
            console.log(`[V2 Repository][${traceId}] MATCH FOUND in student_accounts, _id: ${student._id}, Name: "${student.name}"`);
            student.academicProfile = await AcademicProfile.findOne({ student: student._id });
        } else {
            console.log(`[V2 Repository][${traceId}] NO MATCH FOUND in student_accounts for ID: "${id}"`);
        }
        return student;
    }

    async create(data, traceId = 'internal') {
        console.log(`[V2 Repository][${traceId}] Creating StudentAccount document for email: "${data.email}"`);
        const student = new StudentAccount(data);
        return student.save();
    }

    async update(id, data, traceId = 'internal') {
        console.log(`[V2 Repository][${traceId}] Updating StudentAccount ID: "${id}"`);
        const student = await StudentAccount.findByIdAndUpdate(id, data, { new: true })
            .populate('branch')
            .populate('scheme');
        if (student) {
            student.academicProfile = await AcademicProfile.findOne({ student: student._id });
        }
        return student;
    }
}

module.exports = new StudentAccountRepository();
