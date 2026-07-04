# Singapore Translation Context

Physio-Aid is framed for Singapore's active ageing and community-care context.

## Singapore problem framing

The clinical brief positions frailty and falls as major ageing challenges in Singapore. It highlights that a meaningful proportion of older adults are frail or pre-frail and that falls affect about one in three older adults, with higher risk among those aged 80 and above.

The product narrative should connect to:
- healthspan extension
- active ageing
- maintaining independence
- community-based support
- prevention before crisis
- care navigation

## Community-ready care pathway

Physio-Aid should not stop at assessment. The dashboard and report should suggest next steps such as:
- Active Ageing Centre
- Community Health Post
- Physiotherapy Clinic
- caregiver-supported practice
- community screening and triage
- rehabilitation service follow-up

Do not hard-code specific centre names or live directory data for the MVP unless the team verifies them near submission.

## Deployment settings

| Setting | Use case |
|---|---|
| Home | Older adult or caregiver-supported assessment |
| Active Ageing Centre | Community screening and triage |
| Community Health Post | Care navigation and review |
| Physiotherapy Clinic | Professional assessment and follow-up |
| Rehabilitation service | Monitoring between sessions |
| Research network | Benchmark data generation with explicit consent |

## PDPA-aware design

Use Singapore PDPA-aware principles:
- purpose limitation
- data minimisation
- consent
- access restriction
- retention discipline
- accountability
- optional research participation
- anonymisation for future research data

This is not legal advice. The hackathon MVP should show awareness and sensible safeguards.

## Data minimisation

Collect only:
- data required for the assessment
- safety and emergency-contact data required for movement testing
- derived movement metrics where possible
- optional research consent separately

Avoid:
- NRIC
- full address
- unnecessary medical history
- raw video storage by default
- background tracking
- production claims

## Singapore mobility research opportunity

Future versions could generate local benchmark data for Singapore older adults, but only with explicit optional research consent and anonymised data.

The MVP may include a toggle:
> I agree to contribute anonymised assessment metrics for future Singapore mobility research.

This must be optional and separate from assessment consent.

## Care linkage copy

Suggested dashboard copy:
> Based on your ability–confidence profile, you may benefit from community-based support. Consider sharing this report with an Active Ageing Centre, Community Health Post, or Physiotherapy Clinic for further guidance.

Avoid:
- "You are diagnosed with..."
- "You must..."
- "This treatment is prescribed..."
