# PRISM Spine Calculator

## What to Build
Read PRD.md for full spec. Build a single-page clinical calculator for the PRISM (Prognostic Index for Spinal Metastases) scoring system.

## Design Reference
Match the dark theme from headneckreirradiation.com:
- Black background (#000000)
- White/light text
- Red accent color (#cc0000 / #e53e3e)
- Inter font
- Clean, minimal, professional medical tool aesthetic
- Subtle animations (fade-in on scroll)

## Scoring Logic (CRITICAL -- get this right)

```typescript
interface PRISMInput {
  sex: 'male' | 'female';           // female = +2
  ecog: 0 | 1 | 2 | 3;             // 0=+3.5, 1=+1.5, 2=+0.5, >=3=0
  priorSurgery: boolean;             // yes = +1
  priorRadiation: boolean;           // yes = -1
  organSystemsWithMets: number;      // subtract N (integer >= 0, excluding bone)
  solitaryBoneDisease: boolean;      // yes = +3 (mutually exclusive with organMets > 0)
  timeDxToMet5Years: boolean;        // yes = +3
}

function calculatePRISM(input: PRISMInput): number {
  let score = 0;
  if (input.sex === 'female') score += 2;
  if (input.ecog === 0) score += 3.5;
  else if (input.ecog === 1) score += 1.5;
  else if (input.ecog === 2) score += 0.5;
  // ecog >= 3 adds 0
  if (input.priorSurgery) score += 1;
  if (input.priorRadiation) score -= 1;
  score -= input.organSystemsWithMets;
  if (input.solitaryBoneDisease) score += 3;
  if (input.timeDxToMet5Years) score += 3;
  return score;
}

// Groups:
// Group 1 (Excellent): score > 7
// Group 2 (Good): score 4-7
// Group 3 (Intermediate): score 1-3  
// Group 4 (Poor): score < 1
```

## Validation Rules
- If solitaryBoneDisease is true, organSystemsWithMets MUST be 0. Show warning if user tries both.
- organSystemsWithMets is number of OTHER organ systems (not bone). Examples: lung, liver, brain, etc.

## Page Structure (single page, sections)
1. **Hero** -- "PRISM" title, "Prognostic Index for Spinal Metastases" subtitle, one-liner about validated tool for spine SBRT
2. **Calculator** -- Form with all inputs, real-time score, result card with group + color coding
3. **About** -- What PRISM is, development/validation (Mayo + MDACC cohorts), intended use
4. **Reference** -- Collapsible Cox regression table from supplemental data
5. **Footer** -- Disclaimer (not medical advice, for educational purposes), citation

## Cox Regression Data (for reference table)

| Variable | Univariate HR (95% CI) | P value | Multivariable HR (95% CI) | P value |
|----------|----------------------|---------|--------------------------|---------|
| Age | 0.990 (0.980-1.000) | 0.0549 | -- | -- |
| Male sex | 0.655 (0.505-0.850) | 0.0015 | 0.711 (0.542-0.933) | 0.0140 |
| Primary histology | 0.982 (0.946-1.020) | 0.3480 | -- | -- |
| BED10 | 1.010 (1.000-1.020) | 0.0577 | -- | -- |
| ECOG | 2.420 (2.080-2.810) | <0.0001 | 4.124 (2.932-5.801) | <0.0001 |
| Spinal level treated | 0.913 (0.768-1.080) | 0.2990 | -- | -- |
| Prior surgery | 1.110 (0.809-1.530) | 0.5110 | -- | -- |
| Prior RT | 0.645 (0.403-1.030) | 0.0679 | -- | -- |
| Number of organs involved | 1.530 (1.360-1.720) | <0.0001 | 1.338 (1.149-1.559) | 0.0002 |
| Solitary bone metastasis | 0.512 (0.384-0.683) | <0.0001 | 0.729 (0.522-1.018) | 0.0631 |
| Brain metastasis | 2.630 (1.670-4.160) | <0.0001 | 1.135 (0.673-1.913) | 0.6350 |
| Treatment latency | 0.969 (0.946-0.992) | 0.0087 | 0.973 (0.951-0.995) | 0.0155 |

## Style Rules
- NO emojis anywhere in the UI
- Professional medical tone
- Use proper typography (em dashes, proper quotes)
- Color palette: black bg, white text, red accents (#e53e3e), gray for secondary text
- Result card colors: Green (Group 1), Yellow (Group 2), Orange (Group 3), Red (Group 4)
