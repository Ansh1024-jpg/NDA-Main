#create_boq.py
import os
from dotenv import load_dotenv
from langchain.messages import SystemMessage, HumanMessage
from langchain.chat_models import init_chat_model

# Load environment variables
load_dotenv()


system_prompt = """
You are an expert BOQ (Bill of Quantities) generator for a project.
"""

user_prompt = """
Based on the following information received from the user, create a BOQ (Bill of Quantities) for the project in the format provided.

Information received from the user:
{info_summary}

**Instructions:**
1.  **Output Format:** Output *only* the BOQ table in the provided format. Do not include any introductory text, running commentary, or concluding remarks.
2.  **Missing Sections:** If details for a specific section (e.g., "Video Conferencing") are not provided or specified by the user, **do not include that section** in the final BOQ table.
3.  **Missing Values:** If specific values are not provided by the user, replace them with `[Not Specified]`.

**Example Format:**
## BOQ
| Services | Requirements / Description | Qty/Value | Budgetary pricing per unit |
| :--- | :--- | :--- | :--- |
| **IP Telephony** | **Area Type**<br>Offices - Number of admin/management offices per building | [Value] | - |
| | Accommodations - Number of accommodation units | [Value] | - |
| | Other area types (Hotel, Hospital etc) and rooms: [Details] | - | - |
| | **IP Phones - Office Area** | | |
| | Executive Phone: Cisco 8845 | [Value] | 1250 |
| | Manager Phone: Cisco 9871 | [Value] | 1600 |
| | Employee Phone: Cisco 9851 | [Value] | 950 |
| | Conference Room: Cisco 8832 | [Value] | 3500 |
| | Any other: [Specify] | [Value] | - |
| | **IP Phones - Accommodation Area** | | |
| | Living Room: Cisco 9851 | [Value] | 950 |
| | Bed Room: Cisco 7821 | [Value] | 600 |
| | Wash Room / Rest Room: Cisco 7811 | [Value] | 450 |
| | **Features**<br>Voice mail required | [Yes/No] | - |
| | Calling Requirements (Internal Only / Internal + SIP Trunk) | [Selection] | - |
| **SIP Trunk_ISP** | **Location Coordinates** | [Value] | - |
| | **Number of DIDs required** | [Value] | Pricing depends on requirements |
| | **Number of DID/DOD channels required** | [Value] | Pricing depends on requirements |
| | **Required calling options**<br>Local, National, Mobile, International, Toll Free, etc. | [Selection] | - |
| **Customer Care / Call Center** | **Staffing**<br>Number of supervisors | [Value] | Pricing depends on requirements |
| | Number of Seat Agents | [Value] | Pricing depends on requirements |
| | **Features**<br>Call Recordings | [Value] | - |
| | Storage | [Value] | - |
| | Concurrent Calls | [Value] | - |
| | Detailed Features | [Value] | - |
| **Video Conferencing** | **Meeting Pods/Silent Room/Focus Room**<br>1-2 Person: Desk Mini/Desk/DeskPro | [Value] | - |
| | **Huddle Room**<br>1-3 Person/Chair: Room Bar with 55 inch TV screen and Accessories | [Value] | 18000 |
| | **Small Room**<br>3-6 Person/Chair: Room Bar Pro with 65 inch TV screen and Accessories | [Value] | 38000 |
| | 3-6 Person/Chair: Webex Board 55 Pro (interactive) | [Value] | 55000 |
| | **Executive Director personal office**<br>1-3 Person/Chair: Room Bar Pro with 65 inch TV screen and Accessories | [Value] | 38000 |
| | 1-3 Person/Chair: Webex Board 75 Pro (interactive) | [Value] | 95000 |
| | **Medium meeting room**<br>6-8 Person/Chair: Webex Board 75 Pro (interactive) | [Value] | 95000 |
| | 6-8 Person/Chair: Room Kit EQ with 70 inch TV screen and accessories | [Value] | 60000 |
| | **Large meeting room**<br>8-14 Person/Chair: Room Kit Pro with 75 inch TV screen and accessories | [Value] | 75000 |
| | **Board Room**<br>12-18 Person/Chair: Room Kit Pro with 2x 75 inch or 1x 85 inch TV screen and accessories | [Value] | 80000 |
"""

def create_boq(info_summary:str):
    """
    Generate BOQ from the summary.
    Initializes LLM on demand to avoid side effects during import.
    """
    # Initialize the LLM here to avoid global scope issues
    llm = init_chat_model("gpt-4o", model_provider="azure_openai", api_version="2025-01-01-preview")
    
    final_user_prompt = user_prompt.replace("{info_summary}", info_summary)
    
    # Use proper message types 
    messages= [SystemMessage(content=system_prompt), 
                HumanMessage(content=final_user_prompt)]
                
    response = llm.invoke(messages)
    return response.content

if __name__ == "__main__":
    info_summary = """
        | Section | Question | User Response | |----------------------------------------------|-----------------------------------------------|------------------------------------------------------| | IP Telephony - General Requirements | How many buildings require IP telephony services, and will the site have connectivity to the ABC Network (Yes/No)? | 3 buildings requiring services, Yes | | IP Telephony - Area Breakdown | Could you please specify the details for the different area types? Offices: How many admin/management offices are in each building? Accommodations: How many accommodation units are in each building? Other: Are there any other area types (e.g., Hotel, Hospital) and how many rooms in each building? | Offices: Building A has 10, Building B has 5, Building C has 5. Accommodations: Building A has 0, Buildings B and C have 50 each. Other: No other area types. | | IP Telephony - Office Hardware | For the Office Area, please specify the quantities required for each phone type- Executive Phone, Manager Phone, Employee Phone, Conference Phone, Any other types? | Executive Phone: 5, Manager Phone: 15, Employee Phone: 100, Conference Phone: 3, Other: None | | IP Telephony - Accommodation Hardware | For the Accommodation Area, please specify the quantities required for Living Room, Bed Room, Wash Room / Rest Room | Living Room: 100, Bed Room: 200, Wash Room: 0 | | IP Telephony - Service Features | Is voice mail required (Yes/No)? And regarding calling requirements, do you need Only Internal calls or Internal and External calls both? | Yes, voice mail required, both Internal and External calling capabilities. | | SIP Trunk & ISP - General | Please provide the Location Coordinates. How many DID (direct numbers) and DID/DOD channels are required? | Coordinates: 25.276987, 55.296249; 50 DIDs, 30 Channels. | | SIP Trunk & ISP - Calling Options | Which of the following calling options are required? Local, National, Mobile, International, Toll Free, Any other (please specify)? | Local, Mobile, International | | Customer Care / Call Center - Capacity | For the Call Center, please specify: Number of Supervisors, Number of Seat Agents, Number of Concurrent Calls | Supervisors: 2, Seat Agents: 10, Concurrent Calls: 15 | | Customer Care / Call Center - Features | Regarding Call Center features, do you require Call Recordings and Storage? Please also list any other detailed features needed. | Yes, call recording required with storage for 6 months; need IVR and basic reporting features. | | Video Conferencing - Room Types & Quantities | Please specify the number of rooms required for each Video Conferencing type: Meeting Pods/Silent Room/Focus Room (1-2 Person), Huddle Room (1-3 Person/Chair), Small Room (3-6 Person/Chair), Executive Director personal office (1-3 Person/Chair), Medium meeting room (6-8 Person/Chair), Large meeting room (8-14 Person/Chair), Board Room (12-18 Person/Chair) | Meeting Pods: 2, Huddle Rooms: 4, Small Rooms: 2, Executive Director Office: 1, Medium Meeting Rooms: 1, Large Meeting Rooms: 1, Board Room: 1 |
    """
    print(create_boq(info_summary=info_summary))


