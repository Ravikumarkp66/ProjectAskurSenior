const fs = require('fs');
const path = require('path');
const Testimonial = require('../models/Testimonial');

const generateTags = (reviewText) => {
    if (!reviewText) return ['Community'];
    const tags = new Set();
    const text = reviewText.toLowerCase();

    if (/note/i.test(text)) tags.add('Notes');
    if (/pyq|question paper|qp/i.test(text)) tags.add('PYQs');
    if (/material|study|document/i.test(text)) tags.add('Study Materials');
    if (/exam|internal|cie|see|test|prep|score|grade|mark/i.test(text)) tags.add('Exam Preparation');
    if (/support|help|clear|doubt|dm|reply/i.test(text)) tags.add('Support');
    if (/guid|instruction|advice|tip|senior/i.test(text)) tags.add('Guidance');
    if (/group|community|admin/i.test(text)) tags.add('Community');
    if (/fast|quick|instant|speed|immediately|time/i.test(text)) tags.add('Quick Response');

    if (tags.size === 0) tags.add('Community');
    return Array.from(tags);
};

class TestimonialService {
    /**
     * Seeds testimonials from seeds/refined_testimonials.json if collection is empty.
     */
    async seedTestimonialsIfEmpty() {
        try {
            const count = await Testimonial.countDocuments();
            if (count > 0) {
                return;
            }

            const jsonPath = path.join(__dirname, '../seeds/refined_testimonials.json');
            if (!fs.existsSync(jsonPath)) {
                console.warn('⚠️ refined_testimonials.json not found in seeds folder.');
                return;
            }

            const rawData = fs.readFileSync(jsonPath, 'utf-8');
            const items = JSON.parse(rawData);

            const seenKeys = new Set();
            const cleanDocs = [];

            for (const item of items) {
                if (!item || !item.review) continue;

                const email = item.email ? item.email.trim() : 'anonymous@sit.ac.in';
                const review = item.review.trim().replace(/\s+/g, ' ');

                if (!review) continue;

                // Deduplicate by email + review combination
                const dedupeKey = `${email.toLowerCase()}_${review.toLowerCase()}`;
                if (seenKeys.has(dedupeKey)) continue;
                seenKeys.add(dedupeKey);

                // Rating: null -> set default to 5
                const rating = (item.rating !== null && item.rating !== undefined && !isNaN(item.rating))
                    ? Number(item.rating)
                    : 5;

                const tags = generateTags(review);
                const source = {
                    form: item.source?.file || 'Form',
                    serialNo: item.source?.serialNo || 0
                };

                cleanDocs.push({
                    email,
                    review,
                    rating,
                    tags,
                    source,
                    isPublished: true,
                    isFeatured: false
                });
            }

            if (cleanDocs.length > 0) {
                console.log(`🌱 Seeding ${cleanDocs.length} testimonials into MongoDB...`);
                await Testimonial.insertMany(cleanDocs);
                console.log('✅ Testimonials seeded successfully!');
            }
        } catch (error) {
            console.error('❌ Error seeding testimonials:', error.message);
        }
    }

    /**
     * Get paginated and filtered testimonials.
     */
    async getTestimonials({ page = 1, limit = 10, search, tag, isFeatured }) {
        const query = { isPublished: true };

        if (isFeatured !== undefined) {
            query.isFeatured = isFeatured === 'true' || isFeatured === true;
        }

        if (tag) {
            query.tags = tag;
        }

        if (search) {
            query.$or = [
                { review: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Testimonial.countDocuments(query);
        const data = await Testimonial.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        return {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
            data
        };
    }

    /**
     * Get random published testimonials using MongoDB $sample aggregation.
     */
    async getRandomTestimonials(limit = 24) {
        const sampleSize = Math.max(1, Math.min(100, Number(limit) || 24));
        const data = await Testimonial.aggregate([
            { $match: { isPublished: true } },
            { $sample: { size: sampleSize } }
        ]);

        return data;
    }

    /**
     * Get featured testimonials.
     */
    async getFeaturedTestimonials() {
        return await Testimonial.find({ isPublished: true, isFeatured: true }).sort({ createdAt: -1 });
    }
}

module.exports = new TestimonialService();
