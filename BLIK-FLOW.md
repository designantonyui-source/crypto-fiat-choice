# BLIK flow

The BLIK payment flow is simulated locally and does not connect to a payment provider or move funds. The prefilled code `123456` produces a successful result after three seconds. Enter `000000` for a declined result or `111111` for a delayed payment that remains pending after five seconds. Other six-digit codes produce success. Transaction history is held in memory for the current session. The delayed state is also available in the BLIK Delayed Storybook story.

Pending BLIK deposits are not charged and can be canceled after a status check. The simulation expires a pending code after 120 seconds, or at the provider expiry timestamp if supplied. The expired state is available in the `BlikExpired` Storybook story.
