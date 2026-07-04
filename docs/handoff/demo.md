# Demo Script — One Polished Patient Journey

## Demo goal

Show Physio-Aid as an end-to-end preventive care pathway. Do not present it as a generic AI movement tracker.

## Persona

Mr Tan is 78 years old and lives independently. He has not recently fallen, but his daughter notices that he is slower standing up from a chair and less confident walking outside. He wants to stay independent and understand whether he should maintain activity, monitor changes, seek community support, or get physiotherapy review.

## Demo timing

Target: under three minutes.

## Demo screens

### 1. Landing page

Message:
> Physio-Aid helps older adults understand movement, confidence, and care needs before a fall happens.

Show:
- calm clinical design
- large text
- start assessment button
- decision-support disclaimer

### 2. Safety screening and consent

Show:
- consent checkbox
- safety checklist:
  - dizziness today
  - breathlessness
  - chest pain or severe pain
  - recent fall or injury
  - needs supervision to stand safely
- clear warning if unsafe

Judge takeaway:
Physio-Aid does not push people into unsafe movement testing.

### 3. Emergency contact setup

Show:
- contact name
- relationship
- phone number
- reason this is collected

Judge takeaway:
Safety escalation is captured before movement testing.

### 4. Demographics

Show:
- age
- gender
- height
- weight
- walking aid use
- falls history
- activity level

Judge takeaway:
The platform captures context for interpretation and future benchmarking.

### 5. Falls efficacy questionnaire

Show four confidence domains:
- balance confidence
- balance recovery confidence
- safe-falling confidence
- post-fall recovery confidence

Use a simple confidence scale. Keep wording editable in config for Shaun.

Judge takeaway:
The app captures perceived ability, not just movement.

### 6. Chair stand assessment

Show:
- instruction screen
- stable chair reminder
- camera setup
- motion sensor permission
- start button
- visible timer
- demo fallback button

Judge takeaway:
The MVP uses a simple, community-ready functional test.

### 7. Sensor / computer vision analytics

Show:
- derived metrics, not raw video
- reps detected
- completion time
- movement rhythm or stability indicator
- manual override or demo mode if needed

Judge takeaway:
The technical system converts movement into usable metrics.

### 8. Ability–Confidence Dashboard

This is the hero screen.

Show:
- ability band
- confidence band
- ability–confidence profile
- risk category
- profile interpretation
- care recommendations
- care linkage
- report export

Example result:
- Ability: reduced
- Confidence: low
- Profile: high vulnerability
- Risk: moderate to high functional-falls risk
- Recommendation: supervised strengthening and balance confidence-building; consider Active Ageing Centre or physiotherapy review

### 9. Report

Show printable/shareable report with:
- assessment date
- safety screening status
- questionnaire summary
- chair stand summary
- ability–confidence profile
- risk category
- care recommendations
- care linkage
- disclaimer: decision support, not diagnosis

### 10. Closing

Say:
> In less than three minutes, Physio-Aid converts a simple chair stand test and four confidence questions into an ability–confidence profile, risk category, personalised recommendation, and care linkage.

## Demo data

Use this fallback dataset if live camera/sensor input fails:

```json
{
  "persona": "Mr Tan",
  "age": 78,
  "walkingAidUse": "none",
  "fallsHistory": "no fall in past 6 months, one near-fall",
  "confidenceScores": {
    "balanceConfidence": 4,
    "balanceRecoveryConfidence": 3,
    "safeFallingConfidence": 2,
    "postFallRecoveryConfidence": 3
  },
  "chairStand": {
    "completionStatus": "completed",
    "repetitions": 5,
    "durationSeconds": 17.8,
    "movementQuality": "variable",
    "source": "demo"
  },
  "motion": {
    "stabilityScore": 0.58,
    "rhythmConsistency": 0.62
  },
  "expectedProfile": "high_vulnerability",
  "riskCategory": "moderate"
}
```

## Demo risks and fallbacks

| Risk | Fallback |
|---|---|
| Camera permission fails | Use demo/manual chair stand metrics |
| Accelerometer permission fails | Use manual timing and demo stability score |
| Analytics bug | Hard-code one safe demo fixture |
| Backend unavailable | Store session in local state |
| Report export fails | Show printable report page |
| Clinical wording questioned | Point to decision support boundary and Shaun review |
