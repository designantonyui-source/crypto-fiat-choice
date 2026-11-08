# BLIK flow

The BLIK payment flow is simulated locally and does not connect to a payment provider or move funds. The prefilled code `123456` produces a successful result after three seconds. Enter `000000` for a declined result or `111111` for a delayed payment that remains pending after five seconds. Other six-digit codes produce success. Transaction history is held in memory for the current session. The delayed state is also available in the BLIK Delayed Storybook story.
