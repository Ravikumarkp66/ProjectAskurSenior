const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../routes/knowledgeBaseRoutes.js');
const scratchPath = path.join(__dirname, 'newAskRoute.js');

let targetContent = fs.readFileSync(targetPath, 'utf8');
const newAskContent = fs.readFileSync(scratchPath, 'utf8');

const startIndex = targetContent.indexOf("// RAG Answer Generation Endpoint");
if (startIndex !== -1) {
    targetContent = targetContent.substring(0, startIndex) + newAskContent;
    fs.writeFileSync(targetPath, targetContent);
    console.log("Successfully replaced /ask route!");
} else {
    console.log("Could not find start index.");
}
