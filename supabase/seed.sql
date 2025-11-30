-- VSU SmartMap Seed Data
-- Generated from .mentor-guide/locations.md

-- =============================================
-- FACILITIES (Buildings, Research, Admin, etc.)
-- =============================================

INSERT INTO facilities (code, name, slug, category, has_rooms, description, latitude, longitude) VALUES
-- Academic Buildings
('CAS', 'College of Arts and Sciences', 'college-of-arts-and-sciences', 'academic', true, 'Main college for humanities, social sciences, and natural sciences.', 10.74661, 124.79708),
('ICT', 'Info. & Comms. Technology Bldg', 'info-comms-technology-bldg', 'academic', true, 'Houses computer labs and classrooms for ICT programs.', 10.73350, 124.79550),
('CET', 'College of Engineering & Technology', 'college-of-engineering-technology', 'academic', true, 'Houses engineering programs (mechanical, civil, agricultural).', 10.74702, 124.79497),
('CFNR', 'College of Forestry & Natural Resources', 'college-of-forestry-natural-resources', 'academic', true, 'Offers forestry and environmental courses; upper campus.', 10.74715, 124.79750),
('NURS', 'College of Nursing', 'college-of-nursing', 'academic', true, 'Nursing education building.', 10.74601, 124.79630),
('CVM', 'College of Veterinary Medicine', 'college-of-veterinary-medicine', 'academic', true, 'Veterinary medicine classrooms and laboratories.', 10.74564, 124.79714),
('CSAT', 'Dept. of Computer Science & Technology', 'dept-of-computer-science-technology', 'academic', true, 'Computing and IT programs; near library.', 10.74434, 124.79432),
('MMDC', 'Multi-Media Department Center', 'multi-media-department-center', 'academic', true, 'Facilities for multimedia/communication programs.', 10.74461, 124.79483),
('DBM', 'Department of Business Management', 'department-of-business-management', 'academic', true, 'Adjacent to other CAS departments.', 10.74499, 124.79494),
('DECON', 'Department of Economics', 'department-of-economics', 'academic', true, 'Offers economics courses.', 10.74524, 124.79478),
('DTED', 'Department of Teacher Education', 'department-of-teacher-education', 'academic', true, 'Teacher-training programs; near Eco-park.', 10.74507, 124.79454),
('CHEM', 'Dept. of Pure & Applied Chemistry', 'dept-of-pure-applied-chemistry', 'academic', true, 'Chemistry laboratories and classrooms.', 10.74689, 124.79441),
('BIOTECH', 'Department of Biotechnology', 'department-of-biotechnology', 'academic', true, 'Biotechnology programs.', 10.74750, 124.79275),
('STAT', 'Department of Statistics', 'department-of-statistics', 'academic', true, 'Statistics department.', 10.74647, 124.79705),
('PHYS', 'Department of Physics', 'department-of-physics', 'academic', true, 'Physics department.', 10.74653, 124.79696),
('MATH', 'Department of Mathematics', 'department-of-mathematics', 'academic', true, 'Mathematics department.', 10.74657, 124.79700),
('GE', 'Department of Geodetic Engineering', 'department-of-geodetic-engineering', 'academic', true, 'Geodetic engineering; Office hours M-F 8am-5pm.', 10.74757, 124.79486),
('MECH', 'Dept. of Mechanical Engineering', 'dept-of-mechanical-engineering', 'academic', true, 'Includes Crop Processing & Engineering Workshop.', 10.74828, 124.79486),
('DABE', 'Dept. of Ag. & Biosystems Engineering', 'dept-of-ag-biosystems-engineering', 'academic', true, 'Agricultural engineering programs; near research centers.', 10.74712, 124.79510),
('PLANTB', 'Dept. of Genetic Resource & Plant Breeding', 'dept-of-genetic-resource-plant-breeding', 'academic', true, 'Plant breeding research and education.', 10.74724, 124.79274),
('HSART', 'Highschool Arts & Letters Building', 'highschool-arts-letters-building', 'academic', true, 'Building for high school arts and letters programs.', 10.74168, 124.79028),
('COMART', 'Communication Arts Building', 'communication-arts-building', 'academic', true, 'Houses communication arts classrooms.', 10.74182, 124.79019),
('HOMESCI', 'Home Science Building', 'home-science-building', 'academic', true, 'Building for home science education.', 10.74173, 124.78992),
('VACADMIN', 'Old VAC Administration Building', 'old-vac-administration-building', 'academic', true, 'Former administration building.', 10.74126, 124.79053),
('HIGHSC', 'VSU Integrated High School', 'vsu-integrated-high-school', 'academic', true, 'Main high school building.', 10.74137, 124.79057),
('MATHNS', 'Mathematics and Natural Sciences Bldg', 'mathematics-and-natural-sciences-bldg', 'academic', true, 'Building for mathematics and natural sciences.', 10.74066, 124.79090),
('ELEMENT', 'VSU Foundation Elementary School', 'vsu-foundation-elementary-school', 'academic', true, 'Elementary school operated by VSU.', 10.74062, 124.79153),
('MARLAB', 'VSU Marine Laboratory', 'vsu-marine-laboratory', 'academic', true, 'Marine science laboratory near the sea.', 10.74007, 124.79124),
('IHK', 'Institute of Human Kinetics', 'institute-of-human-kinetics', 'academic', true, 'PE and human kinetics programs.', 10.74374, 124.79668),
('PLANTSCI', 'Plant & Science Building', 'plant-science-building', 'academic', true, 'Plant sciences and labs; near Eco Park.', 10.74611, 124.79339),

-- Research Centers
('ISRDS', 'Inst. of Strategic Research & Dev. Studies', 'inst-of-strategic-research-dev-studies', 'research', true, 'Conducts strategic R&D studies.', 10.74477, 124.79408),
('PHILROOT', 'PhilRootcrops', 'philrootcrops', 'research', true, 'National root and tuber crops research center.', 10.74773, 124.79364),
('NCRC', 'National Coconut Research Center', 'national-coconut-research-center', 'research', true, 'Coconut production and technologies.', 10.74857, 124.79455),
('NARC', 'National Abaca Research Center', 'national-abaca-research-center', 'research', true, 'Abaca breeding and research.', 10.74842, 124.79435),
('PCC', 'Philippine Carabao Center', 'philippine-carabao-center', 'research', true, 'Carabao breeding and research.', 10.74157, 124.79685),
('NCRCSH', 'NCRC Screenhouse', 'ncrc-screenhouse', 'research', false, 'Greenhouse for coconut experiments.', 10.74879, 124.79410),
('COCOLAB', 'Coconut Tissue Laboratory', 'coconut-tissue-laboratory', 'research', false, 'Specialized facility for coconut tissue culture.', 10.74897, 124.79437),
('TISSUELAB', 'Tissue Culture Laboratory', 'tissue-culture-laboratory', 'research', false, 'Plant tissue-culture facility adjacent to NCRC.', 10.74835, 124.79417),

-- Administrative
('USSO', 'Accreditation & Student Services', 'accreditation-student-services', 'administrative', true, 'USSO, Recreation Center, USSC office.', 10.74608, 124.79655),

-- Offices
('CAF', 'College of Ag. & Food Science (Office)', 'college-of-ag-food-science-office', 'office', true, 'Admin office for CAF.', 10.74752, 124.79311),
('ANNALS', 'Annals of Tropical Research Office', 'annals-of-tropical-research-office', 'office', false, 'Journal office on University Avenue.', 10.74730, 124.79315),

-- Library
('LIB', 'VSU Library', 'vsu-library', 'library', true, 'Main library (books, journals, digital).', 10.74386, 124.79471),

-- Medical
('HOSP', 'VSU Hospital', 'vsu-hospital', 'medical', true, 'Medical services for students/staff.', 10.74387, 124.78984),

-- Lodging
('APART', 'VSU Apartelle', 'vsu-apartelle', 'lodging', true, 'University hostel/guest house.', 10.74253, 124.78849),
('GUEST', 'VSU Guest House', 'vsu-guest-house', 'lodging', true, 'Visitor residential building; near Sports Center.', 10.74211, 124.78880),
('HOSTEL', 'VSU Hostel', 'vsu-hostel', 'lodging', true, 'Hostel for guests; near Amphitheater.', 10.74054, 124.78979),

-- Dining
('FAST', 'VSU Fastfood Center', 'vsu-fastfood-center', 'dining', false, 'Meals and snacks; upper campus.', 10.74436, 124.79552),
('PAVILION', 'VSU Pavilion', 'vsu-pavilion', 'dining', false, 'Campus food court pavilion.', 10.74187, 124.78894),
('BAKERY', 'VSU Bakery', 'vsu-bakery', 'dining', false, 'Campus bakery/shop.', 10.74230, 124.79185),
('MARKET1', 'VSU Market Food Stalls (Bldg 1)', 'vsu-market-food-stalls-bldg-1', 'dining', false, 'Market building 1.', 10.74235, 124.79406),
('MARKET2', 'VSU Market Food Stalls (Bldg 2)', 'vsu-market-food-stalls-bldg-2', 'dining', false, 'Market building 2.', 10.74214, 124.79400),
('VISCA', 'VISCA Market', 'visca-market', 'commercial', false, 'Marketplace/market complex.', 10.74234, 124.79444),
('MARKETX', 'VSU Market Complex', 'vsu-market-complex', 'commercial', false, 'General market complex.', 10.74211, 124.79472),
('ATICAF', 'ATI Cafeteria', 'ati-cafeteria', 'dining', false, 'Cafeteria for ATI complex.', 10.74093, 124.78959),

-- Sports
('GYM', 'VSU Gymnasium', 'vsu-gymnasium', 'sports', false, 'Indoor gymnasium.', 10.74321, 124.79671),
('OVAL', 'VSU Athletic Oval', 'vsu-athletic-oval', 'sports', false, 'Track and field.', 10.74313, 124.79746),
('SPORTSC', 'VSU Sports Center', 'vsu-sports-center', 'sports', true, 'Sports complex near Frog Fountain.', 10.74273, 124.79033),

-- Landmarks
('UPAMPHI', 'VSU Upper Amphitheater', 'vsu-upper-amphitheater', 'landmark', false, 'Outdoor events venue (upper campus).', 10.74684, 124.79603),
('AMPHI', 'Amphitheater (Lower Oval)', 'amphitheater-lower-oval', 'landmark', false, 'Outdoor events venue (lower campus).', 10.74159, 124.79028),
('FFOUN', 'Frog Fountain', 'frog-fountain', 'landmark', false, 'Iconic landmark.', 10.74276, 124.79129),
('CONV', 'VSU Convention Center', 'vsu-convention-center', 'landmark', true, 'Meetings and ceremonies; near Lower Oval.', 10.74197, 124.79170),
('JAPGAR', 'Japanese Garden', 'japanese-garden', 'landmark', false, 'Japanese-style garden.', 10.74668, 124.79531),
('ECO', 'Eco Park', 'eco-park', 'landmark', false, 'Ecological exhibits (approx coords).', 10.74650, 124.79500),
('MINITH', 'Mini Theater', 'mini-theater', 'landmark', false, 'Small theater for events.', 10.74216, 124.79437),

-- Utility
('PWRPLT', 'VSU Power Plant', 'vsu-power-plant', 'utility', false, 'Power-generation facility.', 10.74253, 124.79208),
('FUEL', 'VSU Fuel Station', 'vsu-fuel-station', 'utility', false, 'Fuel station within campus.', 10.74286, 124.79196),
('WWTP', 'Waste-Water Treatment Facility', 'waste-water-treatment-facility', 'utility', false, 'Near hospital and sports center.', 10.74255, 124.78844),

-- Parking
('GSDPARK', 'GSD Parking Garage', 'gsd-parking-garage', 'parking', false, 'Parking structure.', 10.74325, 124.79096),
('PARK', 'Parking Area (NCRC)', 'parking-area-ncrc', 'parking', false, 'Parking near NCRC.', 10.74779, 124.79318),

-- Commercial/Other
('IGP', 'IGP Building', 'igp-building', 'commercial', true, 'Commercial/Office (Income Generating Project).', 10.74228, 124.79422),
('PCOTT', 'President''s Cottage', 'presidents-cottage', 'residential', false, 'Residence for university president.', 10.74148, 124.78965),
('ATITC', 'ATI Training Center', 'ati-training-center', 'administrative', true, 'Agriculture Training Institute center.', 10.74122, 124.78937),
('COA', 'Commission on Audit', 'commission-on-audit', 'administrative', true, 'Government audit office.', 10.74222, 124.79245),

-- =============================================
-- DORMITORIES
-- =============================================
-- Male Dormitories
('MAHOG', 'Mahogany Men''s Hall', 'mahogany-mens-hall', 'dormitory', true, 'Male dorm; near Fastfood/Library.', 10.74427, 124.79505),
('MOLAVE', 'Molave Men''s Dormitory', 'molave-mens-dormitory', 'dormitory', true, 'Male dorm.', 10.74483, 124.79561),
('MABOLO', 'Mabolo Men''s Dormitory', 'mabolo-mens-dormitory', 'dormitory', true, 'Male dorm; near Kanlaon.', 10.74491, 124.79595),
('MULB', 'Mulberry Men''s Dormitory', 'mulberry-mens-dormitory', 'dormitory', true, 'Male dorm; adjacent to Kanlaon.', 10.74433, 124.79616),
('KANLA', 'Kanlaon Dormitory', 'kanlaon-dormitory', 'dormitory', true, 'Male dorm.', 10.74414, 124.79658),
('ZEAMAYS', 'Zea Mays Men''s Hall', 'zea-mays-mens-hall', 'dormitory', true, 'Male dorm.', 10.74213, 124.78914),
('EVERL', 'Everlasting Dormitory', 'everlasting-dormitory', 'dormitory', true, 'Male dorm; near Sports Center.', 10.74250, 124.78989),

-- Female Dormitories
('ILANG', 'Ilang-Ilang Ladies Hall', 'ilang-ilang-ladies-hall', 'dormitory', true, 'Female dorm; near Fastfood.', 10.74396, 124.79522),
('MARIP', 'Mariposa Ladies Dormitory', 'mariposa-ladies-dormitory', 'dormitory', true, 'Female dorm.', 10.74459, 124.79600),
('SAMPA', 'Sampaguita Ladies Dormitory', 'sampaguita-ladies-dormitory', 'dormitory', true, 'Female dorm.', 10.74468, 124.79718),
('CALACH', 'Calachuchi Dormitory', 'calachuchi-dormitory', 'dormitory', true, 'Female dorm; near Sports Center.', 10.74274, 124.78973),
('CATTLEYA', 'Cattleya Dormitory', 'cattleya-dormitory', 'dormitory', true, 'Lower-campus cluster.', 10.74223, 124.78999),
('SUNFLOW', 'Sun Flower Dormitory', 'sun-flower-dormitory', 'dormitory', true, 'Female dorm; near Cattleya.', 10.74206, 124.78969),
('WALING', 'Waling-waling Dormitory', 'waling-waling-dormitory', 'dormitory', true, 'Lower campus.', 10.74228, 124.78959),
('BANAH', 'Banahaw Dormitory', 'banahaw-dormitory', 'dormitory', true, 'Lower-campus cluster.', 10.74257, 124.78942),

-- Cottages
('NARRA', 'Narra Cottage', 'narra-cottage', 'dormitory', true, 'Cottage-style housing.', 10.74285, 124.78922),
('PETUNIA', 'Petunia Cottage', 'petunia-cottage', 'dormitory', true, 'Cottage/housing.', 10.74293, 124.78935),
('COCONUT', 'Coconut Dormitory', 'coconut-dormitory', 'dormitory', true, 'Near lower campus.', 10.74236, 124.78903),
('CAMIA', 'Camia Cottage', 'camia-cottage', 'dormitory', true, 'Cottage; near Sports Center.', 10.74327, 124.79067),
('BOUGAIN', 'Bougainvilla Cottage', 'bougainvilla-cottage', 'dormitory', true, 'Cottage; near Camia.', 10.74312, 124.79076),
('DAHLIA', 'Dahlia Cottage', 'dahlia-cottage', 'dormitory', true, 'Cottage; near main dorm cluster.', 10.74226, 124.79138),
('CHRYS', 'Chrysanthemum Cottage', 'chrysanthemum-cottage', 'dormitory', true, 'Cottage; near Balay Alumni.', 10.74104, 124.79210),
('ATIDORM', 'ATI Dormitory', 'ati-dormitory', 'dormitory', true, 'Dorm at ATI complex.', 10.74076, 124.78976);
