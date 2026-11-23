"""Print a fresh VAPID pair. Keep the private value in your secret manager."""

import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

key = ec.generate_private_key(ec.SECP256R1())
private = key.private_numbers().private_value.to_bytes(32, "big")
public = key.public_key().public_bytes(
    serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint
)
for name, value in [("VAPID_PUBLIC_KEY", public), ("VAPID_PRIVATE_KEY", private)]:
    print(name + "=" + base64.urlsafe_b64encode(value).rstrip(b"=").decode())
