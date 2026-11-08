# Card flow

The card flow runs locally without a payment provider or transfer of funds. Use the test card number `4242 4242 4242 4242` for a successful result or `4000 0000 0000 0002` for a declined result, along with a future expiry date, any three-digit security code and a name. Other valid card numbers produce success. Results appear after three seconds and update the in-memory transaction history. Card details are cleared after submission and are not stored in transaction history.
