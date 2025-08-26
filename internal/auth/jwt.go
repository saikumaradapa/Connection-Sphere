package auth

import "github.com/golang-jwt/jwt/v5"

type JWTAuthenticator struct {
	secretKey string
	aud       string
	iss       string
}

func NewJWTAuthenticator(secretKey, audience, issuer string) *JWTAuthenticator {
	return &JWTAuthenticator{
		secretKey: secretKey,
		aud:       audience,
		iss:       issuer,
	}
}

func (a *JWTAuthenticator) GenerateToken(claims jwt.Claims) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(a.secretKey))

	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func (a *JWTAuthenticator) ValidateToken(tokenString string) (*jwt.Token, error) {
	return nil, nil
}
