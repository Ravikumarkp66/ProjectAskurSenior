/**
 * Script to post the CIE article directly to MongoDB.
 * Run: node scripts/postCIEArticle.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../models/Article');
const User = require('../models/User');

const slugify = (text) => text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

const ARTICLE = {
    title: 'How is CIE Calculated? — A Complete Guide for SIT Students (VTU 2025 Scheme)',
    author: 'AskUrSenior Team',
    coverImage: '',
    content: `
<h2>🔑 First — What is CIE?</h2>
<p><strong>CIE</strong> stands for <strong>Continuous Internal Evaluation</strong>. It's the internal marks you earn throughout the semester — through tests, quizzes, ABL activities, and lab work.</p>
<blockquote><p>🚨 <strong>At SIT (VTU 2025 Scheme), you need a minimum of 18 out of 50 in CIE to be eligible to appear for the SEE (Semester End Exam).</strong> If you don't hit 18, you cannot write the exam — regardless of attendance.</p></blockquote>
<p>Your <strong>Final Score</strong> = CIE (50) + SEE (50) = <strong>100 marks</strong></p>

<h2>📚 Step 1 — Know Your Subject Type</h2>
<p>VTU 2025 Scheme at SIT has <strong>4 types</strong> of subjects, each with a different CIE formula:</p>
<table>
<thead><tr><th>Subject Type</th><th>Credits</th><th>Examples</th></tr></thead>
<tbody>
<tr><td><strong>IPCC</strong> (Integrated theory + lab)</td><td>4 credits</td><td>Physics, Chemistry, Engineering Science</td></tr>
<tr><td><strong>Theory Only</strong></td><td>3 or 4 credits</td><td>Maths, Data Structures, OOPS, DBMS, etc.</td></tr>
<tr><td><strong>Lab Only</strong></td><td>1 or 2 credits</td><td>Programming Lab, Physics Lab, DS Lab, etc.</td></tr>
<tr><td><strong>Low Theory</strong></td><td>1 or 2 credits</td><td>Constitution, Kannada, Bridge Courses</td></tr>
</tbody>
</table>

<h2>📐 Step 2 — The Formula for Each Subject Type</h2>

<h3>🔷 Type 1: THEORY ONLY (3 or 4 Credit Subjects)</h3>
<p><strong>Total CIE = 50 marks</strong></p>
<table>
<thead><tr><th>Component</th><th>What You Write</th><th>Marks Counted As</th><th>Minimum to Pass</th></tr></thead>
<tbody>
<tr><td>Test 1 + Test 2</td><td>Each out of 50 → Total out of 100</td><td><strong>34 marks</strong></td><td>Combined ≥ 40</td></tr>
<tr><td>Quiz 1 + Quiz 2</td><td>Each out of 20 → Total out of 40</td><td><strong>8 marks</strong></td><td>Combined ≥ 16</td></tr>
<tr><td>ABL 1 + ABL 2</td><td>Each out of 20 → Total out of 40</td><td><strong>8 marks</strong></td><td>Combined ≥ 16</td></tr>
<tr><td><strong>Total CIE</strong></td><td></td><td><strong>50 marks</strong></td><td><strong>≥ 18 to sit for SEE</strong></td></tr>
</tbody>
</table>
<p><strong>How the math works:</strong></p>
<pre><code>Test CIE  = (Test1 + Test2) ÷ 100 × 34
Quiz CIE  = (Quiz1 + Quiz2) ÷ 40  × 8
ABL CIE   = (ABL1  + ABL2)  ÷ 40  × 8
─────────────────────────────────────────
Total CIE = Test CIE + Quiz CIE + ABL CIE  (out of 50)</code></pre>
<p><strong>Real Example:</strong></p>
<ul>
<li>Test 1 = 38, Test 2 = 42 → (80/100) × 34 = <strong>27.2</strong></li>
<li>Quiz 1 = 17, Quiz 2 = 18 → (35/40) × 8 = <strong>7.0</strong></li>
<li>ABL 1 = 16, ABL 2 = 18 → (34/40) × 8 = <strong>6.8</strong></li>
<li>✅ <strong>Total CIE = 27.2 + 7.0 + 6.8 = 41.0 / 50</strong> — Eligible (≥ 18)</li>
</ul>

<h3>🔶 Type 2: IPCC (4 Credit Subjects — e.g. Physics, Chemistry)</h3>
<p><strong>Total CIE = 50 marks</strong> — split as 25 (Theory) + 25 (Lab)</p>
<h4>Theory Part → out of 25:</h4>
<p>Tests + Quiz + ABL are calculated the same way as Theory Only (raw out of 50), then <strong>proportionally scaled down to 25</strong>.</p>
<h4>Lab Part → out of 25:</h4>
<table>
<thead><tr><th>Component</th><th>Per Lab/Test</th><th>Marks Counted As</th><th>Minimum</th></tr></thead>
<tbody>
<tr><td>Lab Records</td><td><strong>35 marks each</strong> (N labs)</td><td><strong>15 marks total</strong></td><td>Sum of all labs ≥ 140</td></tr>
<tr><td>Lab Test(s)</td><td>15 marks each</td><td><strong>10 marks total</strong></td><td>Sum ≥ 6</td></tr>
</tbody>
</table>
<pre><code>Theory Raw  = (Tests/100 × 34) + (Quiz/40 × 8) + (ABL/40 × 8)
Theory CIE  = Theory Raw ÷ 50 × 25        ← scaled to 25

Lab Record CIE = (Sum of all lab marks ÷ (N × 35)) × 15
                 where N = number of labs conducted this semester
Lab Test CIE   = (Sum of lab test marks ÷ total max) × 10

Total CIE   = Theory CIE + Lab Record CIE + Lab Test CIE</code></pre>
<blockquote><p>📌 Labs are <strong>35 marks each</strong>, but the number of labs (N) varies each semester — it could be 9, 10, 11, or any number set by your faculty. The formula adjusts automatically.</p></blockquote>

<h3>🟢 Type 3: LAB ONLY (1 or 2 Credit Lab Subjects)</h3>
<p><strong>Total CIE = 50 marks</strong> — 100% lab-based</p>
<table>
<thead><tr><th>Component</th><th>Per Entry</th><th>Marks Counted As</th><th>Minimum</th></tr></thead>
<tbody>
<tr><td>Lab Records</td><td><strong>35 marks each</strong> (N labs)</td><td><strong>35 marks total</strong></td><td>Sum of all labs ≥ 140</td></tr>
<tr><td>Lab Test(s)</td><td>15 marks each</td><td><strong>15 marks total</strong></td><td>Sum ≥ 6</td></tr>
<tr><td><strong>Total CIE</strong></td><td></td><td><strong>50</strong></td><td><strong>≥ 18 to sit for SEE</strong></td></tr>
</tbody>
</table>
<pre><code>Lab Record CIE = (Sum of all lab marks ÷ (N × 35)) × 35
Lab Test CIE   = (Sum of lab test marks ÷ total max) × 15
Total CIE      = Lab Record CIE + Lab Test CIE</code></pre>

<h3>🟡 Type 4: LOW THEORY (1 or 2 Credit Theory Subjects)</h3>
<p>Applies to subjects like Constitution of India, Kannada, Bridge Courses.</p>
<table>
<thead><tr><th>Component</th><th>Raw Max</th><th>Marks Counted As</th><th>Minimum</th></tr></thead>
<tbody>
<tr><td>Test 1 + Test 2</td><td>/100</td><td><strong>34 marks</strong></td><td>Sum ≥ 40</td></tr>
<tr><td>Quiz + ABL (combined)</td><td>/40</td><td><strong>16 marks</strong></td><td>Sum ≥ 16</td></tr>
<tr><td><strong>Total CIE</strong></td><td></td><td><strong>50</strong></td><td><strong>≥ 18 to sit for SEE</strong></td></tr>
</tbody>
</table>

<h2>⚠️ Step 3 — The Eligibility Rules You Cannot Ignore</h2>
<p>Every component has its own minimum. Fail even one, and you're <strong>not eligible for SEE</strong>.</p>
<table>
<thead><tr><th>Component</th><th>You Need (Minimum)</th></tr></thead>
<tbody>
<tr><td>Tests (Test 1 + Test 2 combined)</td><td>≥ <strong>40 out of 100</strong></td></tr>
<tr><td>Quizzes (Quiz 1 + Quiz 2 combined)</td><td>≥ <strong>16 out of 40</strong></td></tr>
<tr><td>ABL (ABL 1 + ABL 2 combined)</td><td>≥ <strong>16 out of 40</strong></td></tr>
<tr><td>Lab Records (sum of all)</td><td>≥ <strong>140</strong> (out of N × 35)</td></tr>
<tr><td>Lab Test</td><td>≥ <strong>6</strong> (out of max)</td></tr>
<tr><td><strong>Final CIE Total</strong></td><td>≥ <strong>18 out of 50</strong> ← SIT rule</td></tr>
</tbody>
</table>
<blockquote><p>❗ Example: You scored 45/50 in CIE overall — but your Quiz total was 15/40. <strong>You are NOT eligible for SEE.</strong> The system flags this before VTU office does.</p></blockquote>

<h2>📌 Quick Cheat Sheet</h2>
<table>
<thead><tr><th>Subject Type</th><th>Components</th><th>CIE Max</th><th>Min to Qualify</th></tr></thead>
<tbody>
<tr><td>Theory Only (3/4 cr)</td><td>Tests (34) + Quiz (8) + ABL (8)</td><td>50</td><td><strong>18</strong></td></tr>
<tr><td>IPCC (4 cr)</td><td>Theory scaled (25) + Labs (15) + Lab Test (10)</td><td>50</td><td><strong>18</strong></td></tr>
<tr><td>Lab Only (1/2 cr)</td><td>Lab Records (35) + Lab Test (15)</td><td>50</td><td><strong>18</strong></td></tr>
<tr><td>Low Theory (1/2 cr)</td><td>Tests (34) + Internal (16)</td><td>50</td><td><strong>18</strong></td></tr>
</tbody>
</table>
<blockquote><p>Labs carry <strong>35 marks each</strong>. The number of labs varies each semester (could be 9, 10, 11…). The formula adjusts automatically.</p></blockquote>

<h2>💬 Final Words</h2>
<p>CIE isn't something that happens to you at the end of the semester — it's something you build week by week. Track your marks after every test, quiz, and lab. If you're below the minimums after your first test cycle, you still have time to recover.</p>
<p>Use <strong>AskUrSenior's CIE Analyzer</strong> on your subject dashboard to stay on top of it all. No surprises. No panic at the end of the semester.</p>
<p><strong>All the best! 🚀</strong></p>
<hr/>
<p><em>Based on SIT's academic rules under VTU 2025 Scheme. Always verify with your faculty for the latest updates.</em></p>
`
};

async function main() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!');

    // Find any admin user to use as authorId
    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
        console.error('❌ No admin user found in database. Please create an admin account first.');
        process.exit(1);
    }
    console.log(`👤 Using admin: ${adminUser.name || adminUser.email}`);

    // Check if article already exists
    const slug = `${slugify(ARTICLE.title)}-${Date.now().toString().slice(-4)}`;
    const existing = await Article.findOne({ title: ARTICLE.title });
    if (existing) {
        console.log('⚠️  Article with this title already exists. Skipping to avoid duplicates.');
        console.log(`   Existing article slug: ${existing.slug}`);
        await mongoose.disconnect();
        return;
    }

    const article = new Article({
        title: ARTICLE.title,
        slug,
        content: ARTICLE.content,
        author: ARTICLE.author,
        authorId: adminUser._id,
        coverImage: ARTICLE.coverImage
    });

    await article.save();
    console.log('');
    console.log('🎉 Article published successfully!');
    console.log(`   Title  : ${article.title}`);
    console.log(`   Slug   : ${article.slug}`);
    console.log(`   Author : ${article.author}`);
    console.log(`   ID     : ${article._id}`);
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
