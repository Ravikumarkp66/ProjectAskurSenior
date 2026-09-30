/**
 * SIT Tumakuru — Campus Map Static Explorer Data
 * Comprehensive architectural dataset for Siddaganga Institute of Technology (SIT), Tumakuru.
 * Completely free and public dataset — no authentication or personal schedules required.
 */

export const MAP_CATEGORIES = [
    { id: 'all', label: 'All Places', icon: 'Compass' },
    { id: 'academic', label: 'Academic', icon: 'GraduationCap' },
    { id: 'departments', label: 'Departments', icon: 'BookOpen' },
    { id: 'labs', label: 'Labs & Research', icon: 'FlaskConical' },
    { id: 'library', label: 'Library', icon: 'Library' },
    { id: 'hostels', label: 'Hostels', icon: 'Bed' },
    { id: 'food', label: 'Food & Dining', icon: 'Utensils' },
    { id: 'sports', label: 'Sports & Fitness', icon: 'Trophy' },
    { id: 'administration', label: 'Administration', icon: 'Landmark' },
    { id: 'health', label: 'Health & Medical', icon: 'HeartPulse' },
    { id: 'parking', label: 'Parking', icon: 'Car' },
    { id: 'transport', label: 'Gates & Transport', icon: 'DoorOpen' },
    { id: 'student-facilities', label: 'Student Facilities', icon: 'Sparkles' },
];

export const CAMPUS_LOCATIONS = [
    {
        id: 'admin-block',
        name: 'Administration Block',
        shortCode: 'AS-ADM-01',
        category: 'administration',
        categories: ['administration', 'academic'],
        department: 'College Directorate, Registrar & Controller of Examinations',
        description: 'The administrative nerve center of SIT Tumakuru. Houses the Principal’s Directorate, Academic Deans, Central Exam Evaluation Cell, and Financial Accounts Wing.',
        floors: 'Ground + 2 Floors',
        labs: [
            'COE Central Evaluation & Paper Vault',
            'Campus Server Hub & Network Operations Room'
        ],
        classrooms: [
            'Syndicate Room & Governing Council Chamber',
            'Administrative Conference Hall (80 Capacity)'
        ],
        offices: [
            'Principal Directorate & Visitor Chamber',
            'Dean of Academic Affairs',
            'Controller of Examinations (COE)',
            'Finance Officer & Accounts Wing',
            'Student Admissions & Scholarship Desk'
        ],
        nearbyLandmarks: [
            { id: 'birla-auditorium', name: 'Birla Auditorium' },
            { id: 'civil-block', name: 'Civil Block' },
            { id: 'kc-library', name: 'KC Library' },
            { id: 'science-lab', name: 'Physics & Chemistry Labs' }
        ],
        x: 600,
        y: 475,
        searchKeywords: ['admin', 'principal', 'accounts', 'fees', 'exam section', 'coe', 'registrar', 'directorate', 'office', 'admissions', 'scholarship', 'bvb'],
        badge: 'Administrative Nexus'
    },
    {
        id: 'cse-block',
        name: 'Computer Science & Engineering Building',
        shortCode: 'AS-CS-09',
        category: 'academic',
        categories: ['academic', 'departments', 'labs'],
        department: 'Computer Science & Engineering (CSE) & Information Science (ISE)',
        description: 'Multi-story computing sciences hub featuring high-performance computing centers, dedicated AI/ML laboratories, smart conference rooms, and faculty research cubicles.',
        floors: 'Ground + 3 Floors',
        labs: [
            'AI & Machine Learning Innovation Lab (2nd Floor)',
            'Advanced Algorithms & Data Structures Lab (1st Floor)',
            'High-Performance Cloud & Networks Lab (2nd Floor)',
            'NVIDIA CUDA GPU Research Centre (3rd Floor)',
            'Systems Software & Compiler Design Lab (Ground Floor)',
            'IoT & Cyber-Physical Systems Lab (3rd Floor)'
        ],
        classrooms: [
            'Smart Lecture Theatres CS101 – CS108',
            'CS Department Seminar Hall (180 Seats)',
            'Capstone Project Ideation Hall'
        ],
        offices: [
            'HOD Computer Science & Engineering (Room 102)',
            'HOD Information Science & Engineering (Room 202)',
            'Senior Faculty Research Suites',
            'Departmental Placement & Internship Coordinator'
        ],
        nearbyLandmarks: [
            { id: 'birla-auditorium', name: 'Birla Auditorium' },
            { id: 'chemistry-block', name: 'Chemistry Block' },
            { id: 'media-centre', name: 'Media Centre' },
            { id: 'canteen', name: 'SIT College Canteen' }
        ],
        x: 718,
        y: 686,
        searchKeywords: ['computer science', 'cse', 'ise', 'cs block', 'it', 'software', 'programming', 'ai', 'ml', 'nvidia', 'algorithms', 'coding', 'lab'],
        badge: 'Computing Hub'
    },
    {
        id: 'ece-block',
        name: 'Dept. of Electronics & Communication',
        shortCode: 'AS-ECE-04',
        category: 'academic',
        categories: ['academic', 'departments', 'labs'],
        department: 'Electronics & Communication Engineering (ECE)',
        description: 'Advanced telecommunications and microelectronics research facility equipped with high-frequency RF analyzers, clean workbenches, and robotics prototyping setups.',
        floors: 'Ground + 2 Floors',
        labs: [
            'VLSI Design & Cadence EDA Lab (Room 201)',
            'Digital Signal Processing & Embedded Systems Lab (Room 104)',
            'Microwave & RF Antenna Testing Lab (Room 205)',
            'Analog & Digital Communications Lab (Room 102)',
            'Robotics & Industrial Automation Lab (Ground Floor)'
        ],
        classrooms: [
            'EC101 – EC106 Interactive Classrooms',
            'ECE Audio-Visual Seminar Hall'
        ],
        offices: [
            'HOD Electronics & Communication Office',
            'ECE Faculty Workstations',
            'IEEE Student Branch Office'
        ],
        nearbyLandmarks: [
            { id: 'workshop', name: 'Mechanical Workshop' },
            { id: 'electrical-block', name: 'Electrical Block' },
            { id: 'shiva-stadium', name: 'Sri Shivakumara Stadium' },
            { id: 'back-gate', name: 'Campus Back Gate' }
        ],
        x: 195,
        y: 753,
        searchKeywords: ['ece', 'electronics', 'communication', 'vlsi', 'dsp', 'robotics', 'circuits', 'telecom', 'signal processing', 'microelectronics'],
        badge: 'Hardware & RF'
    },
    {
        id: 'electrical-block',
        name: 'Electrical Sciences Block',
        shortCode: 'AS-EEE-02',
        category: 'academic',
        categories: ['academic', 'departments', 'labs'],
        department: 'Electrical & Electronics (EEE) & Electronics & Instrumentation (EIE)',
        description: 'Comprehensive high-power electrical engineering block housing industrial rotary machines, switchgear testers, smart energy grid simulators, and process instrumentation rigs.',
        floors: 'Ground + 2 Floors',
        labs: [
            'Heavy AC/DC Electrical Machines Lab (Heavy Bay)',
            'Power Electronics, Drives & Renewable Energy Lab (Room 103)',
            'Industrial Automation & PLC/SCADA Lab (Room 202)',
            'Microcontroller & Virtual Instrumentation Lab (Room 108)',
            'High Voltage & Relay Testing Station',
            'Project Fabrication & Machine Shop (Annex)'
        ],
        classrooms: [
            'EE101 – EE106 Classrooms',
            'Electrical Sciences Seminar Hall'
        ],
        offices: [
            'HOD Electrical & Electronics Office',
            'HOD Electronics & Instrumentation Office',
            'Department Library & Technical Archives'
        ],
        nearbyLandmarks: [
            { id: 'bio-tech', name: 'Bio Technology Block' },
            { id: 'workshop', name: 'Mechanical Workshop' },
            { id: 'kc-library', name: 'KC Library' },
            { id: 'indoor-stadium', name: 'SIT Indoor Stadium' }
        ],
        x: 185,
        y: 522,
        searchKeywords: ['eee', 'electrical', 'electrical block', 'power', 'machines', 'eie', 'instrumentation', 'switchgear', 'energy', 'smart grid'],
        badge: 'Energy & Power'
    },
    {
        id: 'civil-block',
        name: 'Civil Engineering Block',
        shortCode: 'AS-CIV-03',
        category: 'academic',
        categories: ['academic', 'departments', 'labs'],
        department: 'Civil Engineering & Environmental Technology',
        description: 'Foundational campus department featuring concrete compression testing frames, geotechnical soil analysis bays, hydraulic flumes, and total station surveying stores.',
        floors: 'Ground + 2 Floors',
        labs: [
            'Structural Concrete & Materials Testing Lab',
            'Geotechnical & Soil Mechanics Testing Facility',
            'Hydraulics & Fluid Mechanics Flume Lab',
            'Environmental Engineering & Water Testing Lab',
            'Surveying & Advanced Geomatics Station (Total Station Stores)',
            'Computer-Aided Structural Drafting (CAD) Studio'
        ],
        classrooms: [
            'CV101 – CV106 Smart Classrooms',
            'Sir M. Visvesvaraya Civil Seminar Hall'
        ],
        offices: [
            'HOD Civil Engineering Office',
            'Civil Consultancy & Soil Testing Cell',
            'Faculty Cabins'
        ],
        nearbyLandmarks: [
            { id: 'admin-block', name: 'Administration Block' },
            { id: 'golden-jubilee', name: 'Golden Jubilee Building' },
            { id: 'parking-civil', name: 'Parking (Civil Block)' },
            { id: 'chemistry-block', name: 'Chemistry Block' }
        ],
        x: 535,
        y: 606,
        searchKeywords: ['civil', 'civil block', 'structures', 'survey', 'soil', 'concrete', 'hydraulics', 'environmental', 'cad'],
        badge: 'Infrastructure'
    },
    {
        id: 'workshop',
        name: 'Mechanical Engineering Central Workshop',
        shortCode: 'AS-MECH-05',
        category: 'labs',
        categories: ['labs', 'academic', 'departments'],
        department: 'Mechanical Engineering & Manufacturing Technology',
        description: 'Spacious industrial manufacturing training complex outfitted with CNC milling machines, conventional lathes, foundry casting troughs, welding booths, and sheet metal stations.',
        floors: 'Single High-Bay Heavy Facility',
        labs: [
            'CNC Lathe, Milling & Machining Centre',
            'Machine Shop (Central Lathe & Shaper Bay)',
            'Welding Technology & Sheet Metal Section',
            'Foundry, Sand Moulding & Smithy Shop',
            'Metrology, Gauges & Precision Calibration Lab',
            'Rapid Prototyping & 3D Printing Lab'
        ],
        classrooms: [
            'Engineering Graphics & Machine Drawing Hall',
            'Industrial Safety Briefing Room'
        ],
        offices: [
            'Workshop Superintendent Office',
            'Central Tool Crib & Material Stores',
            'Maintenance Engineer Desk'
        ],
        nearbyLandmarks: [
            { id: 'ece-block', name: 'ECE Block' },
            { id: 'electrical-block', name: 'Electrical Block' },
            { id: 'shiva-stadium', name: 'Sri Shivakumara Stadium' }
        ],
        x: 195,
        y: 707,
        searchKeywords: ['workshop', 'mechanical', 'mech', 'lathe', 'cnc', 'manufacturing', 'welding', 'smithy', 'foundry', 'machine shop', 'tools'],
        badge: 'Heavy Fabrication'
    },
    {
        id: 'arch-mca-block',
        name: 'Architecture & MCA Block',
        shortCode: 'AS-ARC-06',
        category: 'academic',
        categories: ['academic', 'departments', 'labs'],
        department: 'School of Architecture & Master of Computer Applications (MCA)',
        description: 'Vibrant creative and computing block designed with open drafting studios, daylight-optimized model-making workshops, and enterprise software laboratories for postgraduate MCA students.',
        floors: 'Ground + 3 Floors',
        labs: [
            'MCA Advanced Software Engineering Lab',
            'Architecture Digital Media & GIS Studio',
            'Physical Scale Architectural Model Workshop',
            'Building Climatology & Acoustics Lab'
        ],
        classrooms: [
            'Architecture Design Studios 1 – 4',
            'MCA Smart Lecture Halls ARC1 – ARC3',
            'Architecture Jury & Review Hall'
        ],
        offices: [
            'Director / HOD School of Architecture Office',
            'HOD MCA Office',
            'Architectural Gallery & Exhibition Hall'
        ],
        nearbyLandmarks: [
            { id: 'mba-block', name: 'MBA Block' },
            { id: 'temple', name: 'Vidya Ganapathi Temple' },
            { id: 'birla-auditorium', name: 'Birla Auditorium' }
        ],
        x: 1025,
        y: 255,
        searchKeywords: ['architecture', 'mca', 'arch', 'design', 'drawing', 'studio', 'software', 'model making', 'exhibition'],
        badge: 'Design & Computing'
    },
    {
        id: 'mba-block',
        name: 'Dept. of Management Studies (MBA Block)',
        shortCode: 'AS-MBA-07',
        category: 'academic',
        categories: ['academic', 'departments'],
        department: 'Master of Business Administration (MBA)',
        description: 'Executive management education building featuring tiered amphitheatre lecture halls, modern business analytics terminals, and group discussion chambers for corporate training.',
        floors: 'Ground + 2 Floors',
        labs: [
            'Business Analytics & Financial Modeling Lab',
            'Language & Corporate Communication Lab'
        ],
        classrooms: [
            'Executive Amphitheatre Classrooms MBA-1 & MBA-2',
            'Case Study & Syndicate Discussion Rooms 1 – 4'
        ],
        offices: [
            'Director MBA Studies Office',
            'Corporate Relations & Management Placement Cell',
            'Alumni Association Desk'
        ],
        nearbyLandmarks: [
            { id: 'temple', name: 'Vidya Ganapathi Temple' },
            { id: 'volleyball-court', name: 'Volleyball Court' },
            { id: 'basketball-court', name: 'Basketball Court' },
            { id: 'arch-mca-block', name: 'Architecture & MCA Block' }
        ],
        x: 700,
        y: 105,
        searchKeywords: ['mba', 'management', 'business', 'mba block', 'placement', 'finance', 'marketing', 'hr', 'corporate'],
        badge: 'Executive Studies'
    },
    {
        id: 'kc-library',
        name: 'Kempegowda Central Library (KC Library)',
        shortCode: 'AS-LIB-01',
        category: 'library',
        categories: ['library', 'student-facilities', 'academic'],
        department: 'Central Library & Digital Information Resources',
        description: 'Flagship academic knowledge repository housing over 130,000 print volumes, national and international journal subscriptions, digital e-learning labs, and air-conditioned silent study cubicles.',
        floors: 'Ground + 2 Floors + Reference Mezzanine',
        labs: [
            'Digital Library & E-Resource Centre (80 Computer Terminals)',
            'IEEE, Springer & ScienceDirect Online Access Room',
            'Reprography & Digital Document Scanning Counter'
        ],
        classrooms: [
            'Reference & Thesis Archive Section',
            'Quiet Study Halls (450 Seating Capacity)',
            'Audio-Visual Presentation Room'
        ],
        offices: [
            'Chief Librarian Chamber',
            'Book Issue, Return & Circulation Counter',
            'SC/ST Book Bank & Merit Distribution Desk'
        ],
        nearbyLandmarks: [
            { id: 'admin-block', name: 'Administration Block' },
            { id: 'bio-tech', name: 'Bio Technology Block' },
            { id: 'electrical-block', name: 'Electrical Block' },
            { id: 'coffee-shop', name: 'Library Coffee Stop' }
        ],
        x: 324,
        y: 397,
        searchKeywords: ['library', 'kc library', 'books', 'reading', 'journals', 'digital library', 'ieee', 'study', 'quiet', 'research', 'thesis'],
        badge: 'Knowledge Hub'
    },
    {
        id: 'birla-auditorium',
        name: 'Birla Auditorium',
        shortCode: 'AS-AUD-02',
        category: 'student-facilities',
        categories: ['student-facilities', 'administration'],
        department: 'Institutional Events & Cultural Affairs',
        description: 'State-of-the-art air-conditioned auditorium with seating capacity of 1,200+. Host venue for college convocations, international technical symposiums, youth fests, and cultural galas.',
        floors: 'Ground Tier + Mezzanine Balcony',
        labs: [
            'Audio-Visual Production & Stage Light Control Booth',
            'High-Fidelity Sound Engineering Console'
        ],
        classrooms: [
            'VIP Reception Lounge',
            'Backstage Green Rooms (Men & Women)',
            'Rehearsal & Performance Prep Studio'
        ],
        offices: [
            'Auditorium Operations Manager Office',
            'Cultural Activities Convenor Desk'
        ],
        nearbyLandmarks: [
            { id: 'admin-block', name: 'Administration Block' },
            { id: 'cse-block', name: 'CSE Block' },
            { id: 'chemistry-block', name: 'Chemistry Block' },
            { id: 'science-lab', name: 'Physics & Chemistry Lab' }
        ],
        x: 807,
        y: 447,
        searchKeywords: ['birla auditorium', 'auditorium', 'hall', 'convocation', 'cultural', 'events', 'seminar', 'annual day', 'fest'],
        badge: 'Event Hall'
    },
    {
        id: 'golden-jubilee',
        name: 'Golden Jubilee Research Building',
        shortCode: 'AS-GJB-08',
        category: 'academic',
        categories: ['academic', 'labs'],
        department: 'Interdisciplinary Research & Center of Excellence',
        description: 'Erected to mark 50 years of SIT’s academic excellence. Dedicated to interdisciplinary postgraduate research, patent incubation, nanotechnology, and sponsored consultancy projects.',
        floors: 'Ground + 3 Floors',
        labs: [
            'Nanomaterials Characterization Lab',
            'Advanced Thin Films & Surface Engineering Lab',
            'Composite Materials Testing Station',
            'Patent Facilitation & Intellectual Property Cell'
        ],
        classrooms: [
            'Postgraduate Research Lecture Rooms GJ101 – GJ106',
            'Golden Jubilee Multi-Purpose Conference Hall'
        ],
        offices: [
            'Dean of Research & Development (R&D)',
            'Industry-Institute Partnership Cell (IIPC)',
            'Visiting Research Scholars Lounge'
        ],
        nearbyLandmarks: [
            { id: 'civil-block', name: 'Civil Block' },
            { id: 'amenities', name: 'Amenities' },
            { id: 'bio-centre', name: 'Bio Centre' }
        ],
        x: 365,
        y: 650,
        searchKeywords: ['golden jubilee', 'jubilee', 'research', 'rnd', 'patents', 'nano', 'consultancy', 'postgraduate', 'phd'],
        badge: 'Research Facility'
    },
    {
        id: 'science-lab',
        name: 'Physics & Chemistry Central Labs',
        shortCode: 'AS-SCI-11',
        category: 'labs',
        categories: ['labs', 'academic'],
        department: 'First-Year Basic Sciences & Humanities',
        description: 'Central experimental facility for all first-year B.E. students conducting fundamental experiments in optical lasers, mechanics, chemical thermodynamics, and volumetric analysis.',
        floors: 'Ground Floor + First Floor Wet Lab',
        labs: [
            'Engineering Physics Optics & Laser Lab',
            'Mechanics & Harmonic Oscillations Lab',
            'Engineering Chemistry Analytical Lab',
            'Volumetric Analysis & Water Quality Lab'
        ],
        classrooms: [
            'Demonstration Lecture Hall',
            'Chemical Storage & Hazardous Material Safe Vault'
        ],
        offices: [
            'Basic Sciences Lab In-Charge Desk',
            'Lab Technical Support Cabin'
        ],
        nearbyLandmarks: [
            { id: 'chemistry-block', name: 'Chemistry Block' },
            { id: 'cse-block', name: 'CSE Block' },
            { id: 'birla-auditorium', name: 'Birla Auditorium' }
        ],
        x: 750,
        y: 582,
        searchKeywords: ['science lab', 'physics lab', 'chemistry lab', 'first year', 'optics', 'laser', 'chemical', 'basic science', 'lab'],
        badge: 'Basic Sciences'
    },
    {
        id: 'chemistry-block',
        name: 'Chemistry Block & Material Sciences',
        shortCode: 'AS-CHM-12',
        category: 'academic',
        categories: ['academic', 'departments', 'labs'],
        department: 'Department of Chemistry',
        description: 'Dedicated chemical science facility conducting active research in polymer composites, electrochemical corrosion, green catalysis, and battery electrolyte synthesis.',
        floors: 'Ground + 1 Floor',
        labs: [
            'Polymer Synthesis & Testing Lab',
            'Electrochemical Impedance & Corrosion Lab',
            'Chromatography & Spectrophotometry Room'
        ],
        classrooms: [
            'CH101 & CH102 Lecture Rooms'
        ],
        offices: [
            'HOD Chemistry Office',
            'Faculty Research Cubicles'
        ],
        nearbyLandmarks: [
            { id: 'science-lab', name: 'Physics & Chemistry Lab' },
            { id: 'cse-block', name: 'CSE Block' },
            { id: 'civil-block', name: 'Civil Block' }
        ],
        x: 680,
        y: 622,
        searchKeywords: ['chemistry block', 'chemistry', 'polymers', 'electrochemistry', 'corrosion', 'catalysis'],
        badge: 'Chemical Sciences'
    },
    {
        id: 'bio-tech',
        name: 'Bio Technology Block',
        shortCode: 'AS-BIO-13',
        category: 'academic',
        categories: ['academic', 'departments', 'labs'],
        department: 'Department of Biotechnology',
        description: 'Contemporary life-sciences complex with sterile laminar flow units, bioreactor fermenters, plant tissue culture chambers, and computational genomics stations.',
        floors: 'Ground + 2 Floors',
        labs: [
            'Genetic Engineering & Molecular Biology Lab',
            'Bioprocess Engineering & Fermentation Facility',
            'Bioinformatics & Computational Biology Lab',
            'Microbiology & Plant Tissue Culture Cleanroom'
        ],
        classrooms: [
            'BT101 – BT104 Smart Classrooms',
            'Bio-Tech Departmental Seminar Hall'
        ],
        offices: [
            'HOD Biotechnology Office',
            'Bio-Incubator Liaison Cell',
            'Department Faculty Rooms'
        ],
        nearbyLandmarks: [
            { id: 'kc-library', name: 'KC Library' },
            { id: 'indoor-stadium', name: 'SIT Indoor Stadium' },
            { id: 'electrical-block', name: 'Electrical Block' },
            { id: 'coffee-shop', name: 'Library Coffee Stop' }
        ],
        x: 195,
        y: 364,
        searchKeywords: ['bio technology', 'bio tech', 'biology', 'genetics', 'fermentation', 'tissue culture', 'bioinformatics', 'lab'],
        badge: 'Life Sciences'
    },
    {
        id: 'media-centre',
        name: 'SIT Media & Digital Communications Centre',
        shortCode: 'AS-MED-10',
        category: 'student-facilities',
        categories: ['student-facilities', 'academic'],
        department: 'Public Relations, Student Media & Institutional Branding',
        description: 'Modern campus creative media production hub outfitted with acoustic podcast recording booths, 4K digital video editing suites, and newsroom desks for campus publications.',
        floors: 'Ground Floor Studio Facility',
        labs: [
            'Video Editing & Motion Graphics Suite',
            'Audio Recording & Podcast Sound Booth',
            'Drone & High-End DSLR Equipment Vault'
        ],
        classrooms: [
            'Media Workshop & Interview Prep Room'
        ],
        offices: [
            'Public Relations & Media Officer Office',
            'Student Editorial Board (SIT Chronicle & Tech Mag)',
            'Social Media & Content Creation Hub'
        ],
        nearbyLandmarks: [
            { id: 'cse-block', name: 'CSE Block' },
            { id: 'mg-hostel', name: 'MG Block Hostel' },
            { id: 'canteen', name: 'SIT College Canteen' }
        ],
        x: 718,
        y: 764,
        searchKeywords: ['media centre', 'media', 'news', 'podcast', 'recording', 'video', 'photography', 'chronicle', 'pr', 'editorial'],
        badge: 'Media Studio'
    },
    {
        id: 'canteen',
        name: 'SIT College Central Canteen',
        shortCode: 'AS-CAN-01',
        category: 'food',
        categories: ['food', 'student-facilities'],
        department: 'Campus Hospitality & Student Dining Services',
        description: 'Popular and bustling food court providing hygienic, affordable South Indian breakfast, full North & South Indian meals, fresh juices, dosas, and quick refreshments.',
        floors: 'Ground Floor Dining Pavilion',
        labs: [
            'Steam-Assisted Commercial Kitchen Facility',
            'Water Purification & Quality Testing Unit'
        ],
        classrooms: [
            'Main Dining Area (600+ Seating Capacity)',
            'Faculty & Staff Dedicated Dining Enclosure'
        ],
        offices: [
            'Canteen Supervisor Office',
            'Digital Token & Billing Counter'
        ],
        nearbyLandmarks: [
            { id: 'health-centre', name: 'SIT Health Centre' },
            { id: 'allamaprabhu-hostel', name: 'Allamaprabhu Hostel' },
            { id: 'cse-block', name: 'CSE Block' },
            { id: 'media-centre', name: 'Media Centre' }
        ],
        x: 980,
        y: 750,
        searchKeywords: ['canteen', 'food', 'snacks', 'lunch', 'breakfast', 'coffee', 'tea', 'dosa', 'meals', 'dining', 'cafeteria'],
        badge: 'Campus Dining'
    },
    {
        id: 'health-centre',
        name: 'SIT Health & Medical Centre',
        shortCode: 'AS-HLT-01',
        category: 'health',
        categories: ['health', 'student-facilities'],
        department: 'Campus Health & Emergency Medical Services',
        description: 'Dedicated student health dispensary offering free medical consultations, first-aid treatment, observation beds, in-house pharmacy, and 24/7 emergency ambulance dispatch.',
        floors: 'Ground Floor Clinic',
        labs: [
            'Diagnostic Blood Pressure, Sugar & ECG Monitoring',
            'Sterilization & Dressing Unit'
        ],
        classrooms: [
            'Observation Ward (4 Medical Beds)',
            'Doctor Consultation Chamber'
        ],
        offices: [
            'Resident Medical Officer (RMO) Office',
            'Nursing Staff & Emergency Helpmate Desk',
            'Campus Pharmacy Counter'
        ],
        nearbyLandmarks: [
            { id: 'canteen', name: 'SIT College Canteen' },
            { id: 'allamaprabhu-hostel', name: 'Allamaprabhu Hostel' },
            { id: 'basaveshwara-hostel', name: 'Basaveshwara Hostel' }
        ],
        x: 1042,
        y: 666,
        searchKeywords: ['health centre', 'hospital', 'clinic', 'medical', 'doctor', 'first aid', 'medicine', 'emergency', 'ambulance', 'pharmacy', 'treatment'],
        badge: 'Medical Care'
    },
    {
        id: 'mg-hostel',
        name: 'Mahatma Gandhi (MG) Block Hostel',
        shortCode: 'AS-HST-MG',
        category: 'hostels',
        categories: ['hostels', 'student-facilities'],
        department: 'Hostels & Student Residential Welfare',
        description: 'Senior undergraduate student residential block featuring high-speed Wi-Fi, solar hot water heating, quiet study halls, and table tennis recreation areas.',
        floors: 'Ground + 3 Floors (Capacity: 320 Students)',
        labs: [
            'Wi-Fi Server & Connectivity Rack',
            'Water Purifier RO Plant'
        ],
        classrooms: [
            'Hostel Study & Reading Lounge',
            'Indoor Games Room (Table Tennis & Carrom)'
        ],
        offices: [
            'MG Block Resident Warden Office',
            'Hostel Caretaker & Security Checkpoint'
        ],
        nearbyLandmarks: [
            { id: 'media-centre', name: 'Media Centre' },
            { id: 'cse-block', name: 'CSE Block' },
            { id: 'canteen', name: 'SIT College Canteen' }
        ],
        x: 717,
        y: 821,
        searchKeywords: ['mg hostel', 'hostel mg', 'hostel', 'residence', 'stay', 'rooms', 'student housing', 'dorm'],
        badge: 'Student Residence'
    },
    {
        id: 'allamaprabhu-hostel',
        name: 'Allamaprabhu Block Hostel',
        shortCode: 'AS-HST-ALM',
        category: 'hostels',
        categories: ['hostels', 'student-facilities'],
        department: 'Hostels & Student Residential Welfare',
        description: 'Peaceful residential hall situated near the eastern green fields, providing clean double-occupancy student rooms, garden courtyard, and dedicated reading halls.',
        floors: 'Ground + 3 Floors (Capacity: 380 Students)',
        labs: [
            'In-House Solar Water Heating System',
            'Commercial Laundry & Washing Area'
        ],
        classrooms: [
            'Night Study & Quiet Reading Hall',
            'Courtyard Recreation Zone'
        ],
        offices: [
            'Resident Warden Office',
            'Security & Attendance Desk'
        ],
        nearbyLandmarks: [
            { id: 'health-centre', name: 'SIT Health Centre' },
            { id: 'canteen', name: 'SIT College Canteen' },
            { id: 'basaveshwara-hostel', name: 'Basaveshwara Hostel' }
        ],
        x: 1175,
        y: 669,
        searchKeywords: ['allamaprabhu', 'allama hostel', 'hostel', 'residence', 'dorm', 'rooms', 'allamaprabhu block'],
        badge: 'Student Residence'
    },
    {
        id: 'basaveshwara-hostel',
        name: 'Basaveshwara Block Hostel',
        shortCode: 'AS-HST-BSV',
        category: 'hostels',
        categories: ['hostels', 'student-facilities'],
        department: 'Hostels & Student Residential Welfare',
        description: 'The largest hostel block on campus equipped with dual open-air courtyards, dining mess facility, indoor badminton court, and spacious student accommodations.',
        floors: 'Ground + 3 Floors (Capacity: 500+ Students)',
        labs: [
            'Automated Mess Dishwasher & Steam Kettle',
            'Central High-Volume RO Drinking Water Unit'
        ],
        classrooms: [
            'Dual Open-Air Courtyards',
            'Common Television & Entertainment Lounge'
        ],
        offices: [
            'Chief Warden Hostel Complex Office',
            'Mess Supervisor & Billing Desk'
        ],
        nearbyLandmarks: [
            { id: 'lbs-hostel', name: 'LBS Hostel' },
            { id: 'allamaprabhu-hostel', name: 'Allamaprabhu Hostel' },
            { id: 'health-centre', name: 'SIT Health Centre' },
            { id: 'snacks-shop', name: 'Hostel Avenue Quick Bites' }
        ],
        x: 1337,
        y: 564,
        searchKeywords: ['basaveshwara', 'basava hostel', 'hostel', 'residence', 'dorm', 'rooms', 'mess', 'basaveshwara block'],
        badge: 'Hostel Complex'
    },
    {
        id: 'lbs-hostel',
        name: 'Lal Bahadur Shastri (LBS) Hostel',
        shortCode: 'AS-HST-LBS',
        category: 'hostels',
        categories: ['hostels', 'student-facilities'],
        department: 'Hostels & Student Residential Welfare',
        description: 'East campus residential wing offering well-ventilated rooms, lush tree-lined surroundings, dedicated fitness gym corner, and hostel study lounge.',
        floors: 'Ground + 3 Floors (Capacity: 280 Students)',
        labs: [
            'High-Speed Wi-Fi Router Hub',
            'Solar Thermal Heating Network'
        ],
        classrooms: [
            'Student Study Cubicles',
            'Hostel Fitness & Gymnasium Corner'
        ],
        offices: [
            'LBS Hostel Warden Cabin',
            'Main Gate Security Check'
        ],
        nearbyLandmarks: [
            { id: 'basaveshwara-hostel', name: 'Basaveshwara Hostel' },
            { id: 'snacks-shop', name: 'Hostel Avenue Quick Bites' },
            { id: 'allamaprabhu-hostel', name: 'Allamaprabhu Hostel' }
        ],
        x: 1475,
        y: 565,
        searchKeywords: ['lbs', 'lbs hostel', 'lal bahadur shastri', 'hostel', 'residence', 'dorm', 'rooms'],
        badge: 'Student Residence'
    },
    {
        id: 'indoor-stadium',
        name: 'SIT Indoor Sports Stadium & Gymnasium',
        shortCode: 'AS-SPT-01',
        category: 'sports',
        categories: ['sports', 'student-facilities'],
        department: 'Physical Education & Sports Department',
        description: 'All-weather indoor sports arena with wooden badminton courts, table tennis tables, weightlifting gymnasium, and changing facilities.',
        floors: 'Ground + Mezzanine Viewing Gallery',
        labs: [
            'Strength & Conditioning Fitness Gym with Modern Machines',
            'Sports Physiotherapy & First-Aid Locker'
        ],
        classrooms: [
            '3 Championship Wooden Badminton Courts',
            'Table Tennis Arena & Carrom Boards Zone'
        ],
        offices: [
            'Director of Physical Education Office',
            'Sports Equipment Issue Counter',
            'Coaches & Referees Cabin'
        ],
        nearbyLandmarks: [
            { id: 'shiva-stadium', name: 'Sri Shivakumara Stadium' },
            { id: 'bio-tech', name: 'Bio Technology Block' },
            { id: 'electrical-block', name: 'Electrical Block' }
        ],
        x: 92,
        y: 425,
        searchKeywords: ['indoor stadium', 'stadium', 'sports', 'gym', 'badminton', 'table tennis', 'fitness', 'workout', 'weights', 'exercise'],
        badge: 'Sports Complex'
    },
    {
        id: 'shiva-stadium',
        name: 'Sri Shivakumara Swamiji Outdoor Stadium',
        shortCode: 'AS-SPT-02',
        category: 'sports',
        categories: ['sports', 'student-facilities'],
        department: 'Physical Education & Sports Department',
        description: 'Sprawling athletic facility with a standard 400m running track, central turf football and cricket pitch, and covered spectator pavilion for sports tournaments.',
        floors: 'Outdoor Arena with Spectator Pavilion',
        labs: [
            'Athletic Timing & Photo-Finish Equipment Store',
            'Cricket Pitch Rollers & Maintenance Shed'
        ],
        classrooms: [
            'Full-Sized Football Pitch & Cricket Ground',
            '400-Metre 8-Lane Running Track',
            'Spectator Pavilion Stands'
        ],
        offices: [
            'Grounds Curator & Maintenance Shed'
        ],
        nearbyLandmarks: [
            { id: 'indoor-stadium', name: 'SIT Indoor Stadium' },
            { id: 'electrical-block', name: 'Electrical Block' },
            { id: 'workshop', name: 'Mechanical Workshop' }
        ],
        x: -13,
        y: 470,
        searchKeywords: ['stadium', 'outdoor stadium', 'cricket', 'football', 'running track', 'athletics', 'ground', 'sports', 'shivakumara'],
        badge: 'Main Sports Ground'
    },
    {
        id: 'amenities',
        name: 'Student Amenities Centre & Campus Store',
        shortCode: 'AS-AMN-01',
        category: 'student-facilities',
        categories: ['student-facilities', 'academic'],
        department: 'Campus Convenience & Student Welfare',
        description: 'One-stop shop for academic essentials, containing a textbook bookstore, stationery supply depot, fast photocopy and project spiral-binding bureau, and snack counter.',
        floors: 'Ground Floor Commercial Kiosks',
        labs: [
            'High-Speed Digital Printing & Architectural Plotting Counter',
            'Document Lamination & Hard-Binding Unit'
        ],
        classrooms: [
            'Stationery & Engineering Tools Store',
            'VTU Syllabus Textbooks & Notebooks Depot'
        ],
        offices: [
            'Amenities Store Manager Desk',
            'Courier Parcel Drop & Pick-Up Station'
        ],
        nearbyLandmarks: [
            { id: 'golden-jubilee', name: 'Golden Jubilee Building' },
            { id: 'civil-block', name: 'Civil Block' },
            { id: 'bio-centre', name: 'Bio Centre' }
        ],
        x: 360,
        y: 717,
        searchKeywords: ['amenities', 'store', 'shop', 'xerox', 'print', 'binding', 'stationery', 'books', 'courier', 'photocopy'],
        badge: 'Student Services'
    },
    {
        id: 'parking-civil',
        name: 'Civil Block Vehicle Parking',
        shortCode: 'AS-PRK-01',
        category: 'parking',
        categories: ['parking', 'transport'],
        department: 'Campus Security & Traffic Management',
        description: 'Secure, sheltered parking facility equipped with marked bays for two-wheelers, faculty automobiles, and 24/7 CCTV surveillance cameras.',
        floors: 'Ground Level Parking Lot',
        labs: [
            'Electric Vehicle (EV) Charging Station (2 Points)',
            '24/7 CCTV Security Surveillance Hub'
        ],
        classrooms: [
            '2-Wheeler Parking Bays (250+ Bikes)',
            '4-Wheeler Sheltered Automobile Slots'
        ],
        offices: [
            'Campus Security Gate Post'
        ],
        nearbyLandmarks: [
            { id: 'civil-block', name: 'Civil Block' },
            { id: 'golden-jubilee', name: 'Golden Jubilee Building' },
            { id: 'bio-plant', name: 'Bio Plant' }
        ],
        x: 527,
        y: 686,
        searchKeywords: ['parking', 'parking lot', 'bike parking', 'car parking', 'vehicle', 'ev charging', 'scooter', 'civil parking'],
        badge: 'Campus Parking'
    },
    {
        id: 'bio-centre',
        name: 'Bio Energy Research Centre',
        shortCode: 'AS-BIO-RES',
        category: 'labs',
        categories: ['labs', 'academic'],
        department: 'Applied Sciences & Renewable Energy Development',
        description: 'Dedicated renewable energy experimental facility studying biomass conversion, biofuel extraction, and organic catalytic processes.',
        floors: 'Ground Floor Pilot Testing Bay',
        labs: [
            'Biofuel Combustion & Emissions Testing Lab',
            'Anaerobic Digestor Analytical Cell'
        ],
        classrooms: [
            'Renewable Energy Demonstration Desk'
        ],
        offices: [
            'Principal Project Investigator Desk'
        ],
        nearbyLandmarks: [
            { id: 'bio-plant', name: 'Bio Plant' },
            { id: 'amenities', name: 'Amenities' },
            { id: 'golden-jubilee', name: 'Golden Jubilee Building' }
        ],
        x: 360,
        y: 756,
        searchKeywords: ['bio centre', 'energy', 'biofuel', 'renewable', 'biomass', 'research'],
        badge: 'Clean Energy'
    },
    {
        id: 'bio-plant',
        name: 'Campus Bio Gas & Waste Processing Facility',
        shortCode: 'AS-BIO-PLT',
        category: 'student-facilities',
        categories: ['student-facilities'],
        department: 'Campus Environmental Sustainability & Estate Office',
        description: 'Eco-conscious green infrastructure that converts campus food scraps and biodegradable waste into clean biogas utilized by hostel kitchens.',
        floors: 'Ground Facility & Anaerobic Digestor Tanks',
        labs: [
            'Biogas Pressure & Methane Content Sensor Array',
            'Organic Composting Filtration Bed'
        ],
        classrooms: [
            'Student Green-Campus Study Deck'
        ],
        offices: [
            'Estate Sustainability Supervisor Desk'
        ],
        nearbyLandmarks: [
            { id: 'bio-centre', name: 'Bio Centre' },
            { id: 'parking-civil', name: 'Civil Parking' }
        ],
        x: 528,
        y: 769,
        searchKeywords: ['bio plant', 'biogas', 'waste management', 'green campus', 'sustainability', 'compost', 'recycling'],
        badge: 'Sustainability'
    },
    {
        id: 'basketball-court',
        name: 'SIT Basketball Court',
        shortCode: 'AS-SPT-BB',
        category: 'sports',
        categories: ['sports', 'student-facilities'],
        department: 'Physical Education & Sports Department',
        description: 'Championship-grade acrylic coated outdoor basketball court equipped with night floodlights and perimeter spectator stands.',
        floors: 'Outdoor Court',
        labs: [],
        classrooms: [
            'Standard Hard Court with Shock-Absorbent Acrylic Coating',
            'High-Mast LED Practice Lighting System'
        ],
        offices: [
            'Basketball Team Equipment Box'
        ],
        nearbyLandmarks: [
            { id: 'volleyball-court', name: 'Volleyball Court' },
            { id: 'mba-block', name: 'MBA Block' },
            { id: 'temple', name: 'Vidya Ganapathi Temple' }
        ],
        x: 695,
        y: 238,
        searchKeywords: ['basketball court', 'basketball', 'court', 'hoop', 'sports', 'dribble', 'match'],
        badge: 'Outdoor Court'
    },
    {
        id: 'volleyball-court',
        name: 'SIT Volleyball Court',
        shortCode: 'AS-SPT-VB',
        category: 'sports',
        categories: ['sports', 'student-facilities'],
        department: 'Physical Education & Sports Department',
        description: 'Regulation clay volleyball court situated near the MBA Block, frequently utilized for inter-branch matches and evening athletic training.',
        floors: 'Outdoor Sand & Clay Court',
        labs: [],
        classrooms: [
            'Standard Match Court with Netting & Side Lines'
        ],
        offices: [
            'Referee Stand & Score Desk'
        ],
        nearbyLandmarks: [
            { id: 'basketball-court', name: 'Basketball Court' },
            { id: 'mba-block', name: 'MBA Block' },
            { id: 'temple', name: 'Vidya Ganapathi Temple' }
        ],
        x: 695,
        y: 195,
        searchKeywords: ['volleyball court', 'volleyball', 'court', 'net', 'sports'],
        badge: 'Outdoor Court'
    },
    {
        id: 'kho-kho-court',
        name: 'Kho Kho & Traditional Sports Ground',
        shortCode: 'AS-SPT-KK',
        category: 'sports',
        categories: ['sports', 'student-facilities'],
        department: 'Physical Education & Sports Department',
        description: 'Leveled clay sporting field dedicated to traditional Indian collegiate sports including Kho Kho and Kabaddi championships.',
        floors: 'Outdoor Clay Ground',
        labs: [],
        classrooms: [
            'Regulation Marked Kho Kho Poles & Clay Running Pitch'
        ],
        offices: [],
        nearbyLandmarks: [
            { id: 'kc-library', name: 'KC Library' },
            { id: 'admin-block', name: 'Administration Block' }
        ],
        x: 475,
        y: 512,
        searchKeywords: ['kho kho', 'kho kho court', 'traditional sports', 'kabaddi', 'sports', 'ground'],
        badge: 'Traditional Sports'
    },
    {
        id: 'bank-gate',
        name: 'Bank Gate & Campus ATM Point',
        shortCode: 'AS-GATE-BNK',
        category: 'transport',
        categories: ['transport', 'student-facilities'],
        department: 'Campus Security & Banking Services',
        description: 'West-central entrance gate providing direct pedestrian access and featuring an on-campus Nationalized Bank Branch and 24/7 ATM facility.',
        floors: 'Security Gate & Banking Kiosk',
        labs: [],
        classrooms: [],
        offices: [
            'Canara Bank / Nationalized Bank Campus Branch',
            '24/7 Multi-Bank ATM Kiosk (Cash Withdrawal & Deposit)',
            'Security Post & Pedestrian Turnstile'
        ],
        nearbyLandmarks: [
            { id: 'kc-library', name: 'KC Library' },
            { id: 'coffee-shop', name: 'Library Coffee Stop' },
            { id: 'bio-tech', name: 'Bio Technology Block' }
        ],
        x: 465,
        y: 275,
        searchKeywords: ['bank gate', 'atm', 'bank', 'cash', 'money', 'gate', 'canara bank', 'deposit', 'finance', 'entrance'],
        badge: 'ATM & Banking'
    },
    {
        id: 'back-gate',
        name: 'Campus Back Gate',
        shortCode: 'AS-GATE-BCK',
        category: 'transport',
        categories: ['transport'],
        department: 'Campus Security & Gate Operations',
        description: 'Western campus exit providing fast connectivity toward the railway station, city bus connections, and nearby student housing.',
        floors: 'Security Gate Post',
        labs: [],
        classrooms: [],
        offices: [
            'Security Cabin & Visitor ID Verification Post',
            'Automated Vehicle Boom Barrier'
        ],
        nearbyLandmarks: [
            { id: 'ece-block', name: 'ECE Block' },
            { id: 'workshop', name: 'Mechanical Workshop' },
            { id: 'shiva-stadium', name: 'Sri Shivakumara Stadium' }
        ],
        x: 195,
        y: 275,
        searchKeywords: ['back gate', 'gate', 'exit', 'entrance', 'railway station', 'bus', 'security', 'west gate'],
        badge: 'Campus Gate'
    },
    {
        id: 'temple',
        name: 'Sri Vidya Ganapathi Temple',
        shortCode: 'AS-TMP-01',
        category: 'student-facilities',
        categories: ['student-facilities'],
        department: 'Campus Heritage & Spiritual Centre',
        description: 'Peaceful campus shrine surrounded by flowering gardens and ancient trees. A sacred, quiet sanctuary where students and staff seek blessings before examinations.',
        floors: 'Sanctum & Meditation Courtyard',
        labs: [],
        classrooms: [],
        offices: [
            'Temple Caretaker & Puja Offerings Desk'
        ],
        nearbyLandmarks: [
            { id: 'mba-block', name: 'MBA Block' },
            { id: 'volleyball-court', name: 'Volleyball Court' },
            { id: 'arch-mca-block', name: 'Architecture & MCA Block' }
        ],
        x: 695,
        y: 156,
        searchKeywords: ['temple', 'ganapathi', 'ganesha', 'vidya', 'prayer', 'peace', 'spiritual', 'pooja'],
        badge: 'Campus Shrine'
    },
    {
        id: 'coffee-shop',
        name: 'Library Coffee Stop & Snacks Kiosk',
        shortCode: 'AS-FOD-CF1',
        category: 'food',
        categories: ['food', 'student-facilities'],
        department: 'Student Refreshment Services',
        description: 'Vibrant outdoor café corner beside KC Library offering fresh South Indian filter coffee, tea, fruit juices, puff pastries, and quick bites between study sessions.',
        floors: 'Outdoor Kiosk & Seating Benches',
        labs: [],
        classrooms: [],
        offices: [
            'Coffee Counter & Snack Ordering Point'
        ],
        nearbyLandmarks: [
            { id: 'kc-library', name: 'KC Library' },
            { id: 'bank-gate', name: 'Bank Gate & ATM' },
            { id: 'bio-tech', name: 'Bio Technology Block' }
        ],
        x: 258,
        y: 325,
        searchKeywords: ['coffee', 'tea', 'snacks', 'coffee shop', 'drinks', 'cafeteria', 'library coffee', 'juice', 'refreshments'],
        badge: 'Snack Kiosk'
    },
    {
        id: 'snacks-shop',
        name: 'Hostel Avenue Quick Bites & Refreshments',
        shortCode: 'AS-FOD-SNK',
        category: 'food',
        categories: ['food', 'student-facilities'],
        department: 'Student Refreshment Services',
        description: 'Late-afternoon and evening snack outlet situated along LBS Hostel Road, serving hot samosas, chaats, biscuits, and hot chai for hostel residents.',
        floors: 'Open-Air Kiosk',
        labs: [],
        classrooms: [],
        offices: [
            'Refreshment Counter'
        ],
        nearbyLandmarks: [
            { id: 'lbs-hostel', name: 'LBS Hostel' },
            { id: 'basaveshwara-hostel', name: 'Basaveshwara Hostel' },
            { id: 'allamaprabhu-hostel', name: 'Allamaprabhu Hostel' }
        ],
        x: 1222,
        y: 445,
        searchKeywords: ['snacks', 'tea', 'samosa', 'chaat', 'hostel food', 'evening snacks', 'quick bites', 'refreshments'],
        badge: 'Hostel Kiosk'
    }
];

export const MAP_LEGEND_ITEMS = [
    { label: 'Academic & Depts', color: '#2563EB', icon: 'GraduationCap' },
    { label: 'Central Library', color: '#8B5CF6', icon: 'Library' },
    { label: 'Student Hostels', color: '#A855F7', icon: 'Bed' },
    { label: 'Food & Canteens', color: '#F97316', icon: 'Utensils' },
    { label: 'Sports & Stadiums', color: '#16A34A', icon: 'Trophy' },
    { label: 'Administration', color: '#64748B', icon: 'Landmark' },
    { label: 'Health Centre', color: '#EF4444', icon: 'HeartPulse' },
    { label: 'Parking & Gates', color: '#0284C7', icon: 'Car' },
];
