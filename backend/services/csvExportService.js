const { Parser } = require('json2csv');

exports.generateUsersReportCSV = (reportData) => {
    const fields = [
        { label: 'Name', value: 'name' },
        { label: 'USN', value: 'usn' },
        { label: 'Email', value: 'email' },
        { label: 'JoinedDate', value: row => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '' },
        { label: 'LastActive', value: row => row.lastActiveAt ? new Date(row.lastActiveAt).toLocaleDateString() : '' },
        { label: 'UniqueTabsVisited', value: 'uniqueTabsVisited' }
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(reportData.users);
    
    return csv;
};
