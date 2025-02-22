import bcrypt

class Hash:
    @staticmethod
    def bcrypt(password: str) -> str:
        """Hash a password using bcrypt."""
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    @staticmethod
    def verify(hashed_password: str, plain_password: str) -> bool:
        """Verify a plain password against a hashed password."""
        return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def verify_password(plain_password: str, hashed_password: str):
    return Hash.verify(hashed_password, plain_password)
