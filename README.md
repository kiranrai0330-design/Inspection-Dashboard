# Geotab Inspection Dashboard (Descartes Compliance Suite)

A high-performance compliance dashboard for MyGeotab to track driver inspection completion rates. This dashboard helps fleet managers quickly identify non-compliant drivers and ensure safety across the fleet.

## Features
- **Real-time Compliance Tracking**: Monitor missing, partial, and full compliance across the entire fleet.
- **KPI Summary**: Instant visibility into non-compliance counts and overall fleet score.
- **Interactive Data Table**: Detailed daily breakdown of inspections vs. vehicles driven for each driver.
- **Geotab Native Group Filtering**: Seamlessly filters data based on MyGeotab's organizational groups.
- **7-Day Date Range Enforcement**: Optimized for performance and API call efficiency.
- **CSV Export**: Download detailed reports for offline analysis.

## Tech Stack
- **React 19**
- **Tailwind CSS 4**
- **Motion** (for smooth animations)
- **Lucide React** (for iconography)
- **Vite** (for fast development and building)

## Geotab Integration
This dashboard is designed to be hosted as a MyGeotab Add-In. It uses the Geotab JavaScript SDK to fetch `Trip`, `DVIRLog`, `User`, `Device`, and `Group` data.

### Configuration
To install in MyGeotab, use the following configuration:
```json
{
  "name": "Inspection Dashboard",
  "supportEmail": "kiranrai0330@gmail.com",
  "version": "1.0.0",
  "items": [
    {
      "url": "YOUR_HOSTED_URL",
      "path": "ActivityLink/",
      "menuName": {
        "en": "Inspection Dashboard"
      }
    }
  ]
}
```
