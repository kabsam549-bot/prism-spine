# PRD: PRISM -- Prognostic Index for Spinal Metastases Calculator

## Overview
A clean, clinical-grade web calculator for the PRISM scoring system. Spine SBRT patients enter clinical variables and get a prognostic group (1-4) with survival estimates. Similar design language to headneckreirradiation.com.

## Background
PRISM is a validated prognostic index for patients receiving spinal stereotactic radiosurgery (SSRS). It stratifies patients into 4 groups based on a composite score derived from 6 clinical variables. Developed at Mayo, validated at MDACC.

## Scoring System

| Variable | Score |
|----------|-------|
| Female sex | +2 |
| ECOG Performance Status 0 | +3.5 |
| ECOG Performance Status 1 | +1.5 |
| ECOG Performance Status 2 | +0.5 |
| ECOG Performance Status >=3 | +0 |
| Prior surgery at SSRS site | +1 |
| Prior radiation at SSRS site | -1 |
| Other organ systems with metastasis (N, excluding bone) | -N |
| Solitary bone disease (no other mets) | +3 |
| Time from diagnosis to metastasis >5 years | +3 |

### Prognostic Groups
| Group | Score Range | Prognosis |
|-------|------------|-----------|
| Group 1 | >7 | Excellent |
| Group 2 | 4-7 | Good |
| Group 3 | 1-3 | Intermediate |
| Group 4 | <1 | Poor |

## Features

### Calculator (Primary)
- Step-by-step or single-page form for all 6 PRISM variables
- Real-time score calculation
- Color-coded prognostic group display (green/yellow/orange/red)
- Score breakdown showing contribution of each variable
- Clean, minimal UI -- no clutter

### About / Background
- Brief explanation of PRISM
- Development and validation cohorts (Mayo + MDACC)
- Key citation

### Reference Data (collapsible)
- Univariate and multivariable Cox regression table from supplemental
- Calibration figure (if we can convert EMF to PNG)

## Design
- **Style:** Matches headneckreirradiation.com -- dark theme, minimal, professional
- **Stack:** Next.js + TypeScript + Tailwind CSS
- **Hosting:** Vercel
- **Responsive:** Mobile-first
- **No backend needed** -- pure client-side calculation

## Pages
1. **Home / Calculator** -- Hero with tagline, calculator form, result display
2. **About** -- Background, methodology, citation
3. Single page with sections (like re-RT site), not multi-page

## UI Flow
1. User fills in: Sex, ECOG, Prior surgery (Y/N), Prior RT (Y/N), Number of other organ systems with mets, Solitary bone disease (Y/N), Time from dx to met >5yr (Y/N)
2. Score auto-calculates as fields are filled
3. Result card appears: total score, group, color-coded prognosis bar
4. Breakdown table shows each variable's contribution

## Logic Notes
- "Other organ systems involved with metastasis" = N (integer, 0+). This is SUBTRACTED from score.
- "Solitary bone disease" means no other organ mets -- this should be mutually exclusive with N>0. If user selects solitary bone AND enters organ mets > 0, show validation warning.
- Score can be negative (poor prognosis patients with many organ mets).

## Domain
- TBD (can use Vercel subdomain initially)

## Timeline
- MVP: Today
