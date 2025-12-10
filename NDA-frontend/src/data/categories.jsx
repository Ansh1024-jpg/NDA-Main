// src/data/categories.jsx
const categories = [
  {
    id: "site-details",  // Changed ID to 'site-details'
    title: "Site Details", // Changed title
    description: "Project and Location Details", // Changed description
    accent: "#06b6d4",
    iconUrl: "/icons/building.svg", // Original icon
    subcategories: [
      { id: "project-name", title: "Project Name", description: "Enter the project name" },
      { id: "building-site", title: "Building Site Name", description: "Enter the building site name" },
      { id: "sector-name", title: "Proponent Sector", description: "Name of the sector who owns the Budget" },
    ],
  },
  {
    id: "network",
    title: "Telephony & Conferencing",
    description: "Call, Meetings and Contact Centers Requirements",
    accent: "#8b5cf6",
    iconUrl: "/icons/telephony.svg",
    subcategories: [
      {
        id: "ip-telephony",
        title: "IP Telephony Services (Internal calls, External calls)",
        description: "Select telephony requirements",
        options: ["Yes", "No", "Internal PBX Only", "External PSTN calls required"]
      },
      {
        id: "call-center",
        title: "Call center/Automatic Call distribution system",
        description: "Select Yes or No",
        options: ["Yes", "No"]
      },
      {
        id: "video-conferencing",
        title: "Video Conferencing services",
        description: "Select video conferencing requirements",
        options: [
          "Yes",
          "No",
          { value: "special-rooms", label: "ANY SPECIAL meeting rooms fit out required like Executive Rooms, Telepresence, etc", hasInput: true }
        ]
      },
    ],
  },
  {
    id: "building-coverage",
    title: "Building and Coverage",
    description: "Building Access and Network Coverage Requirements",
    accent: "#3b82f6", // Updated to a professional blue color that complements the design
    iconUrl: "/icons/building-and-tree-svgrepo-com.svg",
    subcategories: [
      { id: "coverage-details", title: "Building and Coverage", description: "AI-driven building and coverage requirements" },
    ],
  },
];

export default categories;

