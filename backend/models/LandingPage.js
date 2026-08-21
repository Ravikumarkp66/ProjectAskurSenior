const mongoose = require('mongoose');
require('./Testimonial'); // Register Testimonial model for populate

const featureSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true },
    shortDescription: { type: String },
    icon: { type: String },
    route: { type: String },
    badge: { type: String },
    isPremium: { type: Boolean, default: false },
    isComingSoon: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 }
}, { _id: false });

const featureCategorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    icon: { type: String },
    order: { type: Number, default: 0 },
    features: [featureSchema]
}, { _id: false });

const comparisonItemSchema = new mongoose.Schema({
    without: { type: String, required: true },
    with: { type: String, required: true },
    icon: { type: String },
    order: { type: Number, default: 0 }
}, { _id: false });

const faqItemSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true }
}, { _id: false });

const previewCardSchema = new mongoose.Schema({
    title: { type: String },
    image: { type: String },
    route: { type: String }
}, { _id: false });

const buttonSchema = new mongoose.Schema({
    text: { type: String },
    link: { type: String }
}, { _id: false });

const landingPageSchema = new mongoose.Schema({
    version: { type: String, default: '3.0.0' },
    status: { type: String, enum: ['published', 'draft'], default: 'published' },
    lastUpdated: { type: Date, default: Date.now },
    
    hero: {
        isVisible: { type: Boolean, default: true },
        badge: { type: String },
        heading: { type: String },
        brandStatement: { type: String },
        description: { type: String },
        primaryButton: buttonSchema,
        secondaryButton: buttonSchema,
        previewCards: [previewCardSchema],
        background: { type: String },
        theme: { type: String }
    },
    
    platformFeatures: {
        isVisible: { type: Boolean, default: true },
        sectionTitle: { type: String, default: 'Platform Features' },
        sectionSubtitle: { type: String, default: 'Explore tools built to elevate your college journey at SIT' },
        featureCategories: [featureCategorySchema]
    },
    
    comparison: {
        isVisible: { type: Boolean, default: true },
        title: { type: String, default: 'Without AskUrSenior vs With AskUrSenior' },
        subtitle: { type: String, default: 'See how AskUrSenior simplifies student life at SIT' },
        items: [comparisonItemSchema]
    },
    
    testimonials: {
        isVisible: { type: Boolean, default: true },
        sectionTitle: { type: String, default: 'What Students Say' },
        subtitle: { type: String, default: 'Real feedback from SITians' },
        // Array of Testimonial ObjectIDs referencing Testimonial collection
        testimonials: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Testimonial'
        }]
    },
    
    faqs: {
        isVisible: { type: Boolean, default: true },
        sectionTitle: { type: String, default: 'Frequently Asked Questions' },
        subtitle: { type: String, default: 'Everything you need to know about AskUrSenior' },
        faqs: [faqItemSchema]
    },
    
    communityContributors: {
        isVisible: { type: Boolean, default: true },
        sectionTitle: { type: String, default: 'Community Contributors' },
        subtitle: { type: String, default: 'The students who helped strengthen the AskUrSenior community by supporting juniors, sharing resources, and contributing valuable information.' }
    },

    cta: {
        isVisible: { type: Boolean, default: true },
        title: { type: String, default: 'Ready to Level Up Your Academic Journey?' },
        description: { type: String, default: 'Join thousands of SIT students already preparing smarter with AskUrSenior.' },
        primaryButton: buttonSchema,
        secondaryButton: buttonSchema,
        backgroundImage: { type: String }
    },
    
    seo: {
        pageTitle: { type: String, default: 'AskUrSenior V3 - Official SIT Student Platform' },
        metaDescription: { type: String, default: 'Notes, PYQs, CGPA analyzer, placement experiences, and AI assistant built natively for SIT students.' },
        keywords: { type: String, default: 'SIT, AskUrSenior, PYQ, Notes, CGPA Calculator, Placement' },
        openGraphImage: { type: String }
    }
}, {
    timestamps: true,
    collection: 'landing_pages'
});

module.exports = mongoose.model('LandingPage', landingPageSchema);
