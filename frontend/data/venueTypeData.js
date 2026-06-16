/**
 * Venue Type SEO data
 * slug        → used in the URL: /venues/type/[slug]
 * dbName      → exact name stored in MongoDB VenueType collection
 * title       → SEO <title> tag
 * description → SEO meta description
 * keywords    → meta keywords
 * h1          → page heading
 * intro       → body paragraphs (array)
 * suitableFor → checklist items
 * label       → small badge above the H1
 */

const venueTypeData = [
  {
    slug: 'meeting-hall',
    dbName: 'Meeting Hall',
    label: 'Meeting Halls',
    title: 'Meeting Hall Booking Across India | RentalMeet',
    description:
      'Book professional meeting halls for corporate meetings, team discussions, client presentations, and business events across India with RentalMeet.',
    keywords:
      'Meeting Hall Booking, Meeting Hall Rental India, Corporate Meeting Venues, Professional Meeting Spaces, Business Meeting Halls',
    h1: 'Professional Meeting Halls for Every Business Need',
    intro: [
      'RentalMeet offers access to well-equipped meeting halls designed to enhance productivity and collaboration. Whether you need a space for a client presentation, team discussion, strategy session, or business meeting, we connect you with verified venues across India.',
      'Our meeting halls come equipped with high-speed Wi-Fi, AV systems, whiteboards, ergonomic seating, and on-site support — everything you need for a productive session.',
    ],
    suitableFor: [
      'Team Meetings',
      'Client Meetings',
      'Strategy Sessions',
      'Presentations',
      'Business Discussions',
      'Startup Meetings',
    ],
  },
  {
    slug: 'farm-house',
    dbName: 'Farm House',
    label: 'Farm Houses',
    title: 'Farm House Booking for Events & Gatherings | RentalMeet',
    description:
      'Book beautiful farm houses for corporate retreats, team outings, private events, celebrations, and outdoor gatherings across India with RentalMeet.',
    keywords:
      'Farm House Booking, Farm House Rental, Event Farm House, Corporate Retreat Venue, Outdoor Event Venue, Team Outing Venue, Private Event Farm House',
    h1: 'Discover Farm Houses for Corporate & Private Events',
    intro: [
      'Looking for a unique venue away from the city hustle? RentalMeet offers access to beautiful farm houses perfect for corporate retreats, team-building activities, private celebrations, outdoor events, and social gatherings.',
      'Enjoy open spaces, natural surroundings, modern amenities, and a refreshing environment that creates unforgettable experiences for your guests and teams.',
    ],
    suitableFor: [
      'Corporate Retreats',
      'Team-Building Activities',
      'Private Celebrations',
      'Outdoor Events',
      'Social Gatherings',
      'Weekend Getaways',
    ],
  },
  {
    slug: 'conference-hall',
    dbName: 'Conference Hall',
    label: 'Conference Halls',
    title: 'Conference Hall Booking Across India | RentalMeet',
    description:
      'Book conference halls for seminars, corporate meetings, business conferences, and events across India with RentalMeet.',
    keywords:
      'Conference Hall Booking, Conference Hall Rental India, Corporate Conference Venues, Business Conference Halls, Seminar Hall Booking',
    h1: 'Conference Hall Booking Made Easy',
    intro: [
      'RentalMeet offers access to modern conference halls designed for business meetings, conferences, seminars, product launches, and professional events. Find venues with advanced AV systems, flexible seating arrangements, catering options, and professional event support.',
    ],
    suitableFor: [
      'Corporate Conferences',
      'Annual Meetings',
      'Product Launches',
      'Business Summits',
      'Industry Seminars',
    ],
  },
  {
    slug: 'govt-auditorium-hall',
    dbName: 'Govt. Auditorium Hall',
    label: 'Govt. Auditorium Halls',
    title: 'Government Auditorium Hall Booking Across India | RentalMeet',
    description:
      'Book government auditorium halls for conferences, seminars, cultural events, award ceremonies, and large official gatherings across India with RentalMeet.',
    keywords:
      'Govt Auditorium Booking, Government Auditorium Hall, Auditorium Hall Rental, Seminar Hall Booking, Large Event Venues India',
    h1: 'Book Government Auditorium Halls for Large-Scale Events',
    intro: [
      'When hosting large audiences, choosing the right auditorium is essential for creating a successful event experience. RentalMeet helps you discover and book well-equipped government auditorium halls across India, designed to accommodate conferences, seminars, educational programs, cultural performances, award ceremonies, and corporate gatherings.',
      'Our auditorium venues offer spacious seating, professional stage setups, advanced audio-visual systems, lighting arrangements, and event support services to ensure your event runs smoothly.',
    ],
    suitableFor: [
      'Corporate Conferences',
      'Seminars & Educational Programs',
      'Cultural Performances',
      'Award Ceremonies',
      'Annual General Meetings',
      'Large-Scale Corporate Gatherings',
    ],
  },
  {
    slug: 'hotel',
    dbName: 'Hotel',
    label: 'Hotels',
    title: 'Hotel Venue Booking for Events & Meetings | RentalMeet',
    description:
      'Book hotel venues for corporate events, conferences, and business meetings across India. Premium facilities with professional hospitality.',
    keywords:
      'Hotel Venue Booking, Hotel Conference Hall, Hotel Event Venues India, Corporate Hotel Booking, Hotel Meeting Rooms',
    h1: 'Premium Hotel Venues for Every Occasion',
    intro: [
      'Hotels offer a complete event experience — from state-of-the-art conference facilities and banquet halls to professional catering and accommodation. RentalMeet connects you with verified hotel venues across India for corporate events, conferences, and celebrations.',
    ],
    suitableFor: [
      'Corporate Conferences',
      'Business Meetings',
      'Product Launches',
      'Gala Dinners',
      'Team Offsites with Stay',
      'Award Ceremonies',
    ],
  },
  {
    slug: 'private-auditorium-hall',
    dbName: 'Private Auditorium Hall',
    label: 'Private Auditorium Halls',
    title: 'Private Auditorium Hall Booking Across India | RentalMeet',
    description:
      'Book private auditorium halls for exclusive conferences, corporate events, performances, and large gatherings across India with RentalMeet.',
    keywords:
      'Private Auditorium Booking, Private Auditorium Hall Rental, Corporate Auditorium Venues, Exclusive Event Hall Booking India',
    h1: 'Book Private Auditorium Halls for Exclusive Events',
    intro: [
      'Private auditorium halls offer complete control over your event environment — ideal for exclusive corporate presentations, theatrical performances, training programs, and large-scale gatherings. RentalMeet helps you find and book premium private auditoriums across India.',
    ],
    suitableFor: [
      'Exclusive Corporate Events',
      'Theatrical Performances',
      'Training Programs',
      'Award Functions',
      'Private Conferences',
      'Film Screenings',
    ],
  },
  {
    slug: 'restaurant',
    dbName: 'Restaurant',
    label: 'Restaurants',
    title: 'Restaurant Venue Booking for Events & Parties | RentalMeet',
    description:
      'Book restaurant venues for corporate dinners, private parties, team lunches, birthday celebrations, and networking events across India with RentalMeet.',
    keywords:
      'Restaurant Venue Booking, Private Dining Venue, Corporate Dinner Venue, Party Restaurant Booking India, Event Restaurant Rental',
    h1: 'Restaurant Venues for Corporate Dinners & Private Parties',
    intro: [
      'Restaurants offer a warm, professional setting for corporate dinners, client entertainment, team celebrations, and private gatherings. RentalMeet connects you with verified restaurant venues across India that can accommodate your group with customized menus and private dining arrangements.',
    ],
    suitableFor: [
      'Corporate Dinners',
      'Client Entertainment',
      'Team Lunches & Celebrations',
      'Birthday & Anniversary Parties',
      'Networking Events',
      'Private Dining',
    ],
  },
  {
    slug: 'school-auditorium-hall',
    dbName: 'School Auditorium Hall',
    label: 'School Auditorium Halls',
    title: 'School Auditorium Hall Booking for Events | RentalMeet',
    description:
      'Book school auditorium halls for seminars, educational events, cultural programs, corporate training, and community gatherings across India with RentalMeet.',
    keywords:
      'School Auditorium Booking, School Hall Rental, Educational Event Venue, Seminar Hall India, Community Event Hall Booking',
    h1: 'Book School Auditorium Halls for Educational & Corporate Events',
    intro: [
      'School auditorium halls are versatile, well-maintained spaces that serve both educational and corporate purposes. RentalMeet helps you find and book school auditoriums across India equipped with seating arrangements, audio-visual systems, and stage facilities.',
    ],
    suitableFor: [
      'Seminars & Workshops',
      'Corporate Training Programs',
      'Cultural Programs',
      'Community Gatherings',
      'Annual Functions',
      'Educational Conferences',
    ],
  },
  {
    slug: 'function-hall',
    dbName: 'Function Hall',
    label: 'Function Halls',
    title: 'Function Hall Booking for Events Across India | RentalMeet',
    description:
      'Book function halls for corporate events, parties, and social gatherings across India with RentalMeet.',
    keywords:
      'Function Hall Booking, Function Hall Rental India, Event Hall Booking, Corporate Function Hall, Party Hall Booking',
    h1: 'Function Halls for Every Celebration & Corporate Event',
    intro: [
      'Function halls are multi-purpose spaces ideal for a wide range of events — from corporate parties and award nights to social celebrations. RentalMeet connects you with verified function halls across India offering flexible layouts, catering support, and event management services.',
    ],
    suitableFor: [
      'Corporate Parties & Events',
      'Award Nights',
      'Birthday & Anniversary Events',
      'Social Gatherings',
      'Product Launch Events',
      'Cultural Celebrations',
    ],
  },
  {
    slug: 'collage-auditorium-hall',
    dbName: 'Collage Auditorium Hall',
    label: 'College Auditorium Halls',
    title: 'College Auditorium Hall Booking for Events | RentalMeet',
    description:
      'Book college auditorium halls for seminars, technical fests, corporate training, cultural events, and large gatherings across India with RentalMeet.',
    keywords:
      'College Auditorium Booking, College Hall Rental, Technical Fest Venue, Seminar Auditorium India, Academic Event Venue',
    h1: 'Book College Auditorium Halls for Academic & Corporate Events',
    intro: [
      'College auditorium halls are spacious, well-equipped venues perfect for technical events, seminars, corporate training, and large cultural programs. RentalMeet helps you discover and book verified college auditoriums across India with modern AV setups and ample seating capacity.',
    ],
    suitableFor: [
      'Technical Fests & Hackathons',
      'Seminars & Symposiums',
      'Corporate Training',
      'Cultural Fests',
      'Recruitment Drives',
      'Educational Conferences',
    ],
  },
  {
    slug: 'open-lawn',
    dbName: 'Open Lawn',
    label: 'Open Lawns',
    title: 'Open Lawn Booking for Outdoor Events | RentalMeet',
    description:
      'Book open lawns for outdoor corporate events, team outings, parties, and large gatherings across India with RentalMeet.',
    keywords:
      'Open Lawn Booking, Outdoor Event Venue India, Lawn Party Venue, Corporate Outdoor Event, Outdoor Lawn Booking',
    h1: 'Open Lawns for Outdoor Events & Celebrations',
    intro: [
      'Open lawns provide a refreshing outdoor setting for large events, corporate gatherings, and celebrations. RentalMeet connects you with verified open lawn venues across India offering ample space, lush greenery, and customizable setups for your event needs.',
    ],
    suitableFor: [
      'Corporate Events & Picnics',
      'Team Outings',
      'Birthday & Anniversary Parties',
      'Product Launch Events',
      'Cultural Festivals',
      'Large Social Gatherings',
    ],
  },
  {
    slug: 'co-work-space',
    dbName: 'Co-Work Space',
    label: 'Co-Work Spaces',
    title: 'Co-Working Space Booking for Meetings & Teams | RentalMeet',
    description:
      'Book co-working spaces for team meetings, remote work sessions, startup events, workshops, and collaborative work across India with RentalMeet.',
    keywords:
      'Co-Working Space Booking, Coworking Space Rental India, Shared Office Space, Startup Workspace Booking, Flexible Office Rental',
    h1: 'Flexible Co-Working Spaces for Teams & Startups',
    intro: [
      'Co-working spaces offer a professional, flexible environment for remote teams, startups, freelancers, and businesses looking for collaborative workspaces without long-term commitments. RentalMeet helps you find and book co-working spaces across India with high-speed internet, meeting rooms, and modern amenities.',
    ],
    suitableFor: [
      'Remote Team Meetings',
      'Startup Operations',
      'Freelancer Workdays',
      'Workshops & Bootcamps',
      'Client Meetings',
      'Team Sprints',
    ],
  },
  {
    slug: 'banquet-hall',
    dbName: 'Banquet Hall',
    label: 'Banquet Halls',
    title: 'Banquet Hall Booking for Events Across India | RentalMeet',
    description:
      'Book elegant banquet halls for corporate events, parties, and social gatherings across India with RentalMeet.',
    keywords:
      'Banquet Hall Booking, Banquet Hall Rental India, Corporate Banquet Venue, Event Banquet Hall, Party Banquet Hall Booking',
    h1: 'Elegant Banquet Halls for Corporate Events & Celebrations',
    intro: [
      'Banquet halls are the premier choice for corporate galas, large celebrations, and award ceremonies. RentalMeet helps you discover and book beautiful banquet halls across India equipped with professional catering, décor support, AV systems, and experienced event staff.',
    ],
    suitableFor: [
      'Corporate Galas & Dinners',
      'Birthday & Anniversary Parties',
      'Product Launch Events',
      'Award Ceremonies',
      'Social Celebrations',
      'Networking Events',
    ],
  },
  {
    slug: 'guest-house',
    dbName: 'Guest House',
    label: 'Guest Houses',
    title: 'Guest House Booking for Events & Stays | RentalMeet',
    description:
      'Book guest houses for corporate stays, team outings, small meetings, private events, and group accommodation across India with RentalMeet.',
    keywords:
      'Guest House Booking India, Guest House Rental, Corporate Guest House, Group Accommodation Booking, Event Guest House',
    h1: 'Guest Houses for Corporate Stays & Private Events',
    intro: [
      'Guest houses offer a comfortable, home-like environment for corporate stays, small meetings, team getaways, and private gatherings. RentalMeet connects you with verified guest houses across India with meeting facilities, accommodation, and event support.',
    ],
    suitableFor: [
      'Corporate Team Stays',
      'Small Group Meetings',
      'Private Events',
      'Team Getaways',
      'Official Delegations',
      'Training Residentials',
    ],
  },
  {
    slug: 'training-center',
    dbName: 'Training Center',
    label: 'Training Centers',
    title: 'Training Center Booking for Workshops & Programs | RentalMeet',
    description:
      'Book training centers for corporate training programs, workshops, skill development sessions, and educational programs across India with RentalMeet.',
    keywords:
      'Training Center Booking, Training Room Rental India, Corporate Training Venue, Workshop Space Booking, Skill Training Center',
    h1: 'Training Centers for Corporate & Educational Programs',
    intro: [
      'Training centers are purpose-built spaces designed for learning, skill development, and knowledge transfer. RentalMeet helps you find and book equipped training centers across India with projectors, whiteboards, breakout rooms, and comfortable seating for effective training delivery.',
    ],
    suitableFor: [
      'Corporate Training Programs',
      'Skill Development Workshops',
      'Certifications & Bootcamps',
      'Leadership Training',
      'Educational Programs',
      'Technical Workshops',
    ],
  },
  {
    slug: 'marriage-garden',
    dbName: 'Marriage Garden',
    label: 'Marriage Gardens',
    title: 'Marriage Garden Booking for Celebrations | RentalMeet',
    description:
      'Book beautiful marriage gardens for celebrations, corporate events, and outdoor gatherings across India with RentalMeet.',
    keywords:
      'Marriage Garden Booking, Garden Venue India, Outdoor Event Venue, Open Garden Booking, Marriage Lawn Rental',
    h1: 'Beautiful Marriage Gardens for Events & Celebrations',
    intro: [
      'Marriage gardens provide a picturesque, open-air setting for large events and celebrations. RentalMeet connects you with verified garden venues across India offering lush landscapes, customizable setups, catering facilities, and professional event coordination.',
    ],
    suitableFor: [
      'Large Celebrations & Events',
      'Corporate Outdoor Events',
      'Anniversary Parties',
      'Cultural Events',
      'Product Launch Events',
      'Social Gatherings',
    ],
  },
];

/**
 * Convert a DB venue type name to its URL slug
 * e.g. "Govt. Auditorium Hall" → "govt-auditorium-hall"
 */
export function venueTypeToSlug(dbName) {
  const match = venueTypeData.find(v => v.dbName === dbName);
  if (match) return match.slug;
  // Fallback: auto-generate slug from name
  return dbName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Get venue type data by slug
 */
export function getVenueTypeBySlug(slug) {
  return venueTypeData.find(v => v.slug === slug) || null;
}

export default venueTypeData;
