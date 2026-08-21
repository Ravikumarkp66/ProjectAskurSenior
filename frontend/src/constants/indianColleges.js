/**
 * Comprehensive list of engineering / technical colleges in India.
 * Karnataka colleges sourced from VTU / GEC Karnataka (gec.karnataka.gov.in).
 * SIT is pre-selected by default in registration forms.
 */

export const DEFAULT_COLLEGE = "Siddaganga Institute of Technology, Tumkur";

export const INDIAN_COLLEGES = [

  // ══════════════════════════════════════════════════════════════════════════
  // KARNATAKA — Government Engineering Colleges
  // ══════════════════════════════════════════════════════════════════════════
  "Sri Krishnadevaraya Jayachamarajendra Institute of Technology (SKSJTI), Bangalore",
  "Government Engineering College, Huvinahadagali",
  "Government Engineering College, Chamarajanagar",
  "Government Engineering College, Hassan",
  "Government Engineering College, Haveri",
  "Government Engineering College, Kushalnagar",
  "Government Engineering College, KR Pet",
  "Government Engineering College, Raichur",
  "Government Engineering College, Ramanagar",
  "Government Engineering College, Karwar",
  "Government Engineering College, Gangavathi",
  "Government Engineering College, Talakal",
  "Government Engineering College, Mosalehosahalli",
  "Government Engineering College, Challakere",
  "Government Engineering College, Bidar",
  "Government Engineering College, Nargund",
  "Government Engineering College, Arasikere",

  // ── University Colleges ───────────────────────────────────────────────────
  "University Visvesvaraya College of Engineering (UVCE), Bangalore",
  "University Visvesvaraya College of Engineering (Evening), Bangalore",
  "University BDT College of Engineering, Davangere",

  // ── Aided Engineering Colleges ────────────────────────────────────────────
  "B.M.S. College of Engineering, Bangalore",
  "B.M.S. College of Engineering (Evening), Bangalore",
  "Dr. Ambedkar Institute of Technology, Bangalore",
  "Basaveswara Engineering College, Bagalkote",
  "B.V.B. College of Engineering and Technology, Hubli",
  "P.D.A. College of Engineering, Kalaburagi",
  "Malnad College of Engineering, Hassan",
  "P.E.S. College of Engineering, Mandya",
  "The National Institute of Engineering, Mysore",
  "The National Institute of Engineering (Evening), Mysore",
  "Sri Jayachamarajendra College of Engineering, Mysore",
  "Sri Jayachamarajendra College of Engineering (Evening), Mysore",

  // ══════════════════════════════════════════════════════════════════════════
  // KARNATAKA — Private Engineering Colleges (District-wise)
  // ══════════════════════════════════════════════════════════════════════════

  // Bagalkote
  "Biluru Gurubasava Mahaswamiji Institute of Technology, Mudhol",
  "Jain Acharya Gundharnandi Maharaj Institute of Technology, Jamakandi",

  // Belagavi (Belgaum)
  "S.G. Balekundri Institute of Technology, Belagavi",
  "K.L.E. Dr. M.S. Sheshagiri College of Engineering and Technology, Belagavi",
  "K.L.E.S. K.L.E. College of Engineering and Technology, Chikkodi",
  "Angadi Institute of Technology and Management, Belagavi",
  "K.L.S. Gogte Institute of Technology, Belagavi",
  "Maratha Mandal Engineering College, Belagavi",
  "Shaikh College of Engineering and Technology, Belagavi",
  "Jain College of Engineering, Machhe, Belagavi",
  "V.S.M. Institute of Technology, Nippani",
  "Hirasugar Institute of Technology, Nidasosi",
  "Jain College of Engineering and Research, Udyambhag, Belagavi",

  // Ballari (Bellary)
  "Ballari Institute of Technology and Management, Ballari",
  "Proudadevaraya Institute of Technology, Hospet",
  "Rao Bahadur Y. Mahabaleswarappa Engineering College, Ballari",

  // Bidar
  "Basavakalyan Engineering College, Basavakalyan",
  "Bheemanna Khandre Institute of Technology, Bhalki",
  "Lingarajappa Engineering College, Bidar",
  "Gurunanak Dev Engineering College, Bidar",

  // Vijayapura (Bijapur)
  "B.L.D.E.A's V.P. Dr. P.G. Halakatti College of Engineering and Technology, Vijayapura",
  "Basava Engineering School of Technology, Vijayapura",
  "Secab Institute of Engineering and Technology, Vijayapura",

  // Chamarajanagara
  "Ekalavya Institute of Technology, Chamarajanagar",

  // Chikkaballapura
  "S.J.C. Institute of Technology, Chikkaballapura",
  "Sha-Shib College of Engineering, Chikkaballapura",

  // Chikkamagaluru
  "Adhichunchanagiri Institute of Technology, Chikkamagaluru",

  // Chitradurga
  "S.J.M. Institute of Technology, Chitradurga",

  // Davangere
  "Bapuji Institute of Engineering and Technology, Davangere",
  "G.M. Institute of Technology, Davangere",
  "Jain Institute of Technology, Davangere",

  // Dharwad (Hubli)
  "K.L.E. Institute of Technology, Hubli",
  "AGM Rural Engineering College, Varur, Hubli",
  "Jain College of Engineering and Technology, Hubballi",
  "K.L.E. Technological University (Formerly BVBCET), Hubli",
  "Sri Dharmasthala Manjunatheshwara Engineering College, Dharwad",

  // Dakshina Kannada (Mangaluru)
  "Alva's Institute of Engineering and Technology, Moodbidri",
  "Yenepoya Institute of Technology, Moodbidri",
  "Karavali Institute of Technology, Mangaluru",
  "K.V.G. College of Engineering, Sullia",
  "Mangalore Institute of Technology and Engineering, Moodbidri",
  "Prasanna College of Engineering and Technology, Ujire",
  "Sahyadri College of Engineering and Management, Mangaluru",
  "Shreedevi Institute of Technology, Kenjar, Mangaluru",
  "Srinivas Institute of Technology, Mangaluru",
  "Vivekananda College of Engineering and Technology, Puttur",
  "Mangalore Marine College and Technology, Mangaluru",
  "A.J. Institute of Engineering and Technology, Mangaluru",
  "Canara Engineering College, Bantwala",
  "P.A. College of Engineering, Bantwala",
  "S.D.M. Institute of Technology, Ujire",
  "St. Joseph Engineering College, Mangaluru",
  "Beary's Institute of Technology, Mangaluru",
  "Srinivas University, Mangaluru",

  // Gadag
  "Smt. Kamala and Sri Venkappa M. Agadi College of Engineering and Technology, Lakshmeshwara",
  "Tontadarya College of Engineering, Gadag",
  "R.T.E. Society's Rural Engineering College, Hulkoti",

  // Hassan
  "Rajeev Institute of Technology, Hassan",
  "Navkis College of Engineering, Hassan",
  "Bahubali College of Engineering, Shravanabelagola",

  // Haveri
  "S.T.J. Institute of Technology, Ranebennur",

  // Kalaburagi (Gulbarga)
  "Shetty Institute of Technology, Kalaburagi",
  "K.C.T. Engineering College, Kalaburagi",
  "Khaja Bande Nawaz College of Engineering, Kalaburagi",
  "Sharnabasava University, Kalaburagi",

  // Kodagu
  "Coorg Institute of Technology, Ponnampet",

  // Kolar
  "C. Byregowda Institute of Technology, Kolar",
  "Dr. T. Thimmaiah Institute of Technology, Kolar (K.G.F.)",
  "Sri Vinayaka Institute of Technology, Kolar (K.G.F.)",

  // Mandya
  "Maharaja Institute of Technology, Mysore",
  "G. Madegowda Institute of Technology, Maddur",
  "Cauvery Institute of Technology, Mandya",
  "Adichunchanagiri University (Formerly BGSIT), Nagamangala",
  "P.E.S. University (Electronic City Campus), Bangalore",

  // Mysuru (Mysore)
  "G.S.S.S. College of Engineering for Women, Mysuru",
  "NIE Institute of Technology, Mysuru",
  "Vidya Vardhaka College of Engineering, Mysuru",
  "Vidya Vikas Institute of Engineering and Technology, Mysuru",
  "ATME College of Engineering, Mysuru",
  "Mysuru Royal Institute of Technology, Mysuru",
  "Mysore College of Engineering and Management, Mysuru",
  "Maharaja Institute of Technology, Tandavapura, Mysuru",
  "JSS Science and Technology University, Mysuru",
  "Mysore School of Architecture, Mysuru",

  // Raichur
  "Navodaya Institute of Technology, Raichur",
  "H.K.E.'s S.L.N. College of Engineering, Raichur",

  // Ramanagara
  "Amrutha Institute of Engineering and Management Sciences, Bidadi",
  "Sampoorna Institute of Technology and Research, Channapatna",
  "Jnanavikasa Institute of Technology, Bidadi",
  "Ghousia Engineering College, Ramanagara",
  "Jain University, School of Engineering and Technology, Kanakapura Road",

  // Shivamogga (Shimoga)
  "Jawaharlal Nehru National College of Engineering, Shivamogga",
  "PES Institute of Technology and Management, Shivamogga",

  // Tumakuru (Tumkur) ← SIT is here
  "Siddaganga Institute of Technology, Tumkur",
  "Akshaya Institute of Technology, Tumkur",
  "Channabasaveshwara Institute of Technology, Gubbi",
  "H.M.S. Institute of Technology, Tumkur",
  "Kalpataru Institute of Technology, Tiptur",
  "Sri Basaveshwara Institute of Technology, Tiptur",
  "Shridevi Institute of Engineering and Technology, Tumkur",
  "Sri Siddartha Institute of Technology, Tumkur",

  // Uttara Kannada (Karwar / Bhatkal)
  "K.L.S. Vishwanathrao Deshpande Rural Institute of Technology, Haliyala",
  "Girijabai Sail Institute of Technology, Karwar",
  "Anjuman Engineering College, Bhatkal",

  // Udupi
  "N.M.A.M. Institute of Technology, Nitte",
  "Shri Madhwa Vadiraja Institute of Technology and Management, Bantakal",
  "Moodalakatte Institute of Technology, Kundapura",
  "NITTE Meenakshi Institute of Technology, Bangalore",

  // Yadagiri
  "Veerappa Nisty Engineering College, Shorapur, Yadagiri",

  // ── Bangalore City Private Colleges ───────────────────────────────────────
  "Acharya Institute of Technology, Bangalore",
  "Acharya Patashala Rural College of Engineering, Bangalore",
  "ACS College of Engineering, Bangalore",
  "Alpha College of Engineering, Bangalore",
  "AMC Engineering College, Bangalore",
  "Atria Institute of Technology, Bangalore",
  "B.N.M. Institute of Technology, Bangalore",
  "B.T.L. Institute of Technology and Management, Bangalore",
  "Bangalore College of Engineering and Technology, Bangalore",
  "Bangalore Institute of Technology, Bangalore",
  "Bangalore Technological Institute, Bangalore",
  "BMS Institute of Technology and Management, Yelahanka, Bangalore",
  "Brindavan College of Engineering, Yelahanka, Bangalore",
  "Cambridge Institute of Technology, Bangalore",
  "City Engineering College, Bangalore",
  "CMR Institute of Technology, Bangalore",
  "CMR University, Bangalore",
  "Dayananda Sagar College of Engineering, Bangalore",
  "Dayananda Sagar Academy of Technology, Bangalore",
  "Dayananda Sagar University, Bangalore",
  "Don Bosco Institute of Technology, Bangalore",
  "East Point College of Engineering and Technology, Bangalore",
  "East West Institute of Technology, Bangalore",
  "East West College of Engineering, Yelahanka, Bangalore",
  "Global Academy of Technology, Bangalore",
  "Gopalan College of Engineering and Management, Bangalore",
  "Impact College of Engineering and Applied Sciences, Bangalore",
  "Islamia Institute of Technology, Bangalore",
  "J.S.S. Academy of Technical Education, Bangalore",
  "Jyothi Institute of Technology, Bangalore",
  "K.N.S. Institute of Technology, Bangalore",
  "K.S. Institute of Technology, Bangalore",
  "K.S. School of Engineering, Bangalore",
  "M.S. Engineering College, Bangalore",
  "M.S. Ramaiah Institute of Technology, Bangalore",
  "M.S. Ramaiah University of Applied Sciences, Bangalore",
  "Nadgir Institute of Engineering and Technology, Bangalore",
  "Nagarjuna College of Engineering and Technology, Bangalore Rural",
  "New Horizon College of Engineering, Bangalore",
  "P.E.S. University, Bangalore",
  "Presidency University, Bangalore",
  "R.L. Jalappa Institute of Technology, Doddaballapura",
  "R.N.S. Institute of Technology, Bangalore",
  "R.R. Institute of Technology, Bangalore",
  "R.V. College of Engineering, Bangalore",
  "Rajarajeshwari College of Engineering, Bangalore",
  "Rajiv Gandhi Institute of Technology, Bangalore",
  "Reva University, Bangalore",
  "Alliance University, Bangalore",
  "Rai Technology University, Doddaballapura",
  "Gitam School of Technology, Doddaballapura",
  "Sai Vidya Institute of Technology, Bangalore",
  "Sambhram Institute of Technology, Bangalore",
  "Saptagiri College of Engineering, Bangalore",
  "S.E.A. College of Engineering and Technology, Bangalore",
  "Sir M. Visvesvaraya Institute of Technology, Bangalore",
  "Sri Dr. Sri Sri Shivakumara Mahaswamy College of Engineering, Bangalore Rural",
  "Sri Jagadguru Balagangadharanatha Swamiji Institute of Technology, Bangalore",
  "Sri Krishna Institute of Technology, Bangalore",
  "Sri Sai Ram College of Engineering, Anekal, Bangalore",
  "Sri Venkateshwara College of Engineering, Bangalore",
  "Sri Vidya Vinayaka Institute of Technology, Bangalore",
  "T. John Engineering College, Bangalore",
  "The Oxford College of Engineering, Bangalore",
  "Vemana Institute of Technology, Bangalore",
  "Vijaya Vitala Institute of Technology, Bangalore",
  "Vivekananda Institute of Technology, Bangalore",
  "Yellamma Dasappa Institute of Technology, Bangalore",
  "H.K.B.K. College of Engineering, Bangalore",
  "M.V.J. College of Engineering, Bangalore",
  "Adarsha Institute of Technology, Bangalore Rural",
  "Cambridge Institute of Technology - North Campus, Devanahalli",
  "Dr. Sri Sri Sri Shivakumara Mahaswamy College of Engineering, Byranayakanahalli",

  // ── Karnataka — NIT / IIT ─────────────────────────────────────────────────
  "NITK Surathkal",
  "IIT Dharwad",
  "Visvesvaraya Technological University (VTU), Belagavi",
  "Manipal Academy of Higher Education, Manipal",

  // ══════════════════════════════════════════════════════════════════════════
  // TAMIL NADU
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Madras",
  "NIT Trichy",
  "Anna University, Chennai",
  "PSG College of Technology, Coimbatore",
  "Coimbatore Institute of Technology, Coimbatore",
  "Amrita School of Engineering, Coimbatore",
  "Sri Sivasubramaniya Nadar College of Engineering, Chennai",
  "Rajalakshmi Engineering College, Chennai",
  "SRM Institute of Science and Technology, Kattankulathur",
  "VIT University, Vellore",
  "Sathyabama Institute of Science and Technology, Chennai",
  "Saveetha Engineering College, Chennai",
  "Easwari Engineering College, Chennai",
  "Jerusalem College of Engineering, Chennai",
  "St. Joseph's College of Engineering, Chennai",
  "Madras Institute of Technology, Chennai",
  "Government College of Engineering, Salem",
  "Kongu Engineering College, Erode",
  "Dr. Mahalingam College of Engineering and Technology, Pollachi",
  "Kumaraguru College of Technology, Coimbatore",
  "Karunya Institute of Technology and Sciences, Coimbatore",
  "Bannari Amman Institute of Technology, Sathyamangalam",
  "Velammal Engineering College, Chennai",
  "Sri Venkateswara College of Engineering, Chennai",
  "College of Engineering, Guindy (CEG), Chennai",
  "Thiagarajar College of Engineering, Madurai",
  "Mepco Schlenk Engineering College, Sivakasi",
  "Kalasalingam Academy of Research and Education, Krishnankoil",
  "SASTRA Deemed University, Thanjavur",
  "Pondicherry Engineering College, Pondicherry",

  // ══════════════════════════════════════════════════════════════════════════
  // MAHARASHTRA
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Bombay",
  "VJTI, Mumbai",
  "COEP Technological University, Pune",
  "Pune Institute of Computer Technology, Pune",
  "MIT College of Engineering, Pune",
  "Symbiosis Institute of Technology, Pune",
  "Vishwakarma Institute of Technology, Pune",
  "Sinhgad College of Engineering, Pune",
  "Walchand College of Engineering, Sangli",
  "K.J. Somaiya College of Engineering, Mumbai",
  "Institute of Chemical Technology, Mumbai",
  "Marathwada Institute of Technology, Aurangabad",
  "Government College of Engineering, Aurangabad",
  "Amrutvahini College of Engineering, Sangamner",
  "NIT Nagpur",
  "Dr. Babasaheb Ambedkar Technological University, Lonere",

  // ══════════════════════════════════════════════════════════════════════════
  // ANDHRA PRADESH & TELANGANA
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Hyderabad",
  "NIT Warangal",
  "Osmania University, Hyderabad",
  "JNTU Hyderabad",
  "JNTU Kakinada",
  "JNTU Anantapur",
  "VNR Vignana Jyothi Institute of Engineering and Technology, Hyderabad",
  "CVR College of Engineering, Hyderabad",
  "Vasavi College of Engineering, Hyderabad",
  "Chaitanya Bharathi Institute of Technology, Hyderabad",
  "Gokaraju Rangaraju Institute of Engineering and Technology, Hyderabad",
  "Sri Venkateswara University, Tirupati",
  "RGUKT Basar",
  "RGUKT Ongole",
  "RGUKT Srikakulam",
  "Andhra University, Visakhapatnam",
  "GITAM University, Visakhapatnam",
  "Vignan's Foundation for Science Technology and Research, Vadlamudi",
  "Koneru Lakshmaiah Education Foundation, Vijayawada",

  // ══════════════════════════════════════════════════════════════════════════
  // KERALA
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Palakkad",
  "NIT Calicut",
  "College of Engineering, Trivandrum",
  "Model Engineering College, Kochi",
  "Government Engineering College, Thrissur",
  "Rajagiri School of Engineering and Technology, Kochi",
  "Cochin University of Science and Technology, Kochi",
  "TKM College of Engineering, Kollam",
  "Mar Athanasius College of Engineering, Kothamangalam",
  "LBS Institute of Technology for Women, Thiruvananthapuram",

  // ══════════════════════════════════════════════════════════════════════════
  // DELHI / NCR
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Delhi",
  "Delhi Technological University",
  "Netaji Subhas University of Technology, Delhi",
  "Jamia Millia Islamia, Delhi",
  "Indraprastha Institute of Information Technology, Delhi",
  "Guru Gobind Singh Indraprastha University, Delhi",
  "Bharati Vidyapeeth's College of Engineering, Delhi",

  // ══════════════════════════════════════════════════════════════════════════
  // UTTAR PRADESH
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Kanpur",
  "IIT BHU, Varanasi",
  "NIT Allahabad",
  "Harcourt Butler Technical University, Kanpur",
  "Amity University, Noida",
  "Galgotias University, Greater Noida",
  "Shiv Nadar University, Greater Noida",
  "Bennett University, Greater Noida",
  "Jaypee Institute of Information Technology, Noida",

  // ══════════════════════════════════════════════════════════════════════════
  // RAJASTHAN
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Jodhpur",
  "NIT Jaipur",
  "BITS Pilani",
  "Malaviya National Institute of Technology, Jaipur",
  "Poornima University, Jaipur",

  // ══════════════════════════════════════════════════════════════════════════
  // GUJARAT
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Gandhinagar",
  "NIT Surat",
  "L.D. College of Engineering, Ahmedabad",
  "Dhirubhai Ambani Institute of Information and Communication Technology, Gandhinagar",
  "Nirma University, Ahmedabad",
  "Charusat University, Anand",

  // ══════════════════════════════════════════════════════════════════════════
  // MADHYA PRADESH
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Indore",
  "NIT Bhopal",
  "MANIT, Bhopal",
  "Acropolis Institute of Technology and Research, Indore",

  // ══════════════════════════════════════════════════════════════════════════
  // WEST BENGAL
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Kharagpur",
  "Jadavpur University, Kolkata",
  "NIT Durgapur",
  "Heritage Institute of Technology, Kolkata",

  // ══════════════════════════════════════════════════════════════════════════
  // PUNJAB & HARYANA
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Ropar",
  "NIT Jalandhar",
  "Thapar Institute of Engineering and Technology, Patiala",
  "Chandigarh University, Mohali",
  "Chitkara University, Punjab",
  "Lovely Professional University, Phagwara",

  // ══════════════════════════════════════════════════════════════════════════
  // UTTARAKHAND
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Roorkee",
  "NIT Uttarakhand",
  "Graphic Era University, Dehradun",
  "DIT University, Dehradun",
  "UPES, Dehradun",

  // ══════════════════════════════════════════════════════════════════════════
  // HIMACHAL PRADESH
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Mandi",
  "NIT Hamirpur",
  "Jaypee University of Information Technology, Solan",

  // ══════════════════════════════════════════════════════════════════════════
  // BIHAR & JHARKHAND
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Patna",
  "NIT Jamshedpur",
  "NIT Patna",
  "BIT Mesra, Ranchi",

  // ══════════════════════════════════════════════════════════════════════════
  // ODISHA
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Bhubaneswar",
  "NIT Rourkela",
  "SOA University, Bhubaneswar",

  // ══════════════════════════════════════════════════════════════════════════
  // ASSAM & NORTH-EAST
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Guwahati",
  "NIT Silchar",
  "Assam Engineering College, Guwahati",

  // ══════════════════════════════════════════════════════════════════════════
  // GOA
  // ══════════════════════════════════════════════════════════════════════════
  "NIT Goa",
  "Goa College of Engineering, Panjim",
  "BITS Goa",

  // ══════════════════════════════════════════════════════════════════════════
  // OTHER IITs
  // ══════════════════════════════════════════════════════════════════════════
  "IIT Tirupati",
  "IIT Bhilai",
  "IIT Jammu",

  // ══════════════════════════════════════════════════════════════════════════
  // OTHER NITs
  // ══════════════════════════════════════════════════════════════════════════
  "NIT Agartala",
  "NIT Andhra Pradesh",
  "NIT Arunachal Pradesh",
  "NIT Manipur",
  "NIT Meghalaya",
  "NIT Mizoram",
  "NIT Nagaland",
  "NIT Puducherry",
  "NIT Sikkim",

  // ══════════════════════════════════════════════════════════════════════════
  // IIITs
  // ══════════════════════════════════════════════════════════════════════════
  "IIIT Hyderabad",
  "IIIT Bangalore",
  "IIIT Allahabad",
  "IIIT Delhi",
  "IIIT Kottayam",
  "IIIT Kancheepuram",
  "IIIT Sri City",
  "IIIT Lucknow",
  "IIIT Vadodara",
  "IIIT Pune",
  "IIIT Ranchi",
  "IIIT Nagpur",
  "IIIT Bhopal",
  "IIIT Gwalior",
  "IIIT Jabalpur",
  "IIIT Srirangam",
  "IIIT Una",
  "IIIT Kalyani",
];
