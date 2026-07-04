# Mobile UI/UX Study Notes

Mobbin references used on 2026-07-04:

- Health assessment/onboarding: [Superpower](https://mobbin.com/screens/0c32440d-a3cf-4d9d-ac8f-329eb1f7c6b2), [Hers](https://mobbin.com/screens/c5d35999-99dd-4583-be65-93db284351a7), [MyFitnessPal](https://mobbin.com/screens/7218e0d4-43ce-4648-ac89-f1b209877833)
- Activity/sensor recording: [Strava](https://mobbin.com/screens/9827c10a-8c85-4fa3-af72-f65bbbfd50cc), [adidas Running](https://mobbin.com/screens/4e6fc847-a346-4a32-a1f7-ba93e5ac0565), [Nike Run Club](https://mobbin.com/screens/6b506d61-b2e1-4690-9cf8-23aa94a80a7e)
- Health results/recommendations: [Zocdoc](https://mobbin.com/screens/6c27446a-63b4-4a90-9633-4ff747f583dc), [Visible](https://mobbin.com/screens/9462d305-4c63-423a-8d00-a282f3de09d1), [WHOOP](https://mobbin.com/screens/d2ed9e2b-52d2-45e0-a53b-6705c9d25f26)

## Patterns To Adopt

- Keep mobile screens focused on one task at a time.
- Use a simple progress strip, not a dense dashboard, during assessment.
- Keep the primary action large, near the thumb zone, and visually dominant.
- For motion tests, show status and one start/stop control first; metrics are secondary.
- For health results, use calm recommendation cards and clear care linkage.
- Avoid squeezed multi-column metric cards on narrow screens.

## Physio-Aid Changes Applied

- Added PWA manifest and install icons.
- Replaced the cramped landing dashboard preview with the actual assessment pathway.
- Improved mobile spacing, safe-area handling, and sticky bottom navigation.
- Made metric cards wrap better on narrow screens.

## Next UI Improvements

- Add a dedicated sensor recording component with permission, start, stop, and fallback states.
- Add a floor-rising camera screen with clear setup guidance before any camera starts.
- Move dashboard cards into a more report-like hierarchy after Shaun reviews wording.
