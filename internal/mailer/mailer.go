package mailer

import "embed"

const (
	FromName            = "Connection Sphere"
	maxRetries          = 3
	UserWelcomeTemplate = "user_invitation.tmpl"
)

//go:embed "templates"
var FS embed.FS // Embeds the "templates" folder into the binary at compile time as a virtual filesystem

type Client interface {
	Send(templateFile, username, email string, data any, isSandbox bool) error
}
