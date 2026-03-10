# SecureGuard - Advanced Discord Security & Verification Bot

A powerful, self-hosted Discord bot focused on **server protection** from raids, nukes, bots, slurs, and unwanted joins.

Features include:
- DM-only verification with math CAPTCHA (anti-bot)
- Account age & risk scoring on join
- Blacklist (auto-ban known bad users)
- Profanity & slur filter (deletes/warns/kicks)
- Anti-nuke protection with **audit log checking** (detects mass deletes, role spam, etc.)
- Basic anti-raid detection with temporary lockdown
- Detailed logging to a staff channel
- Configurable via `.env`

Built with **discord.js v14+** – modern, async, and reliable.

## Features

| Feature                        | Description                                                                 | Status    |
|--------------------------------|-----------------------------------------------------------------------------|-----------|
| DM Verification + CAPTCHA      | New members get DM with "Verify Me" button → math question modal            | ✅        |
| Account Age Gate               | Kicks accounts younger than X days                                          | ✅        |
| Risk Scoring                   | Flags suspicious joins (no avatar, new account, raid timing)               | ✅        |
| Blacklist                      | Auto-ban by user ID or username pattern                                     | ✅        |
| Profanity/Slur Filter          | Deletes messages with slurs → warns → optional kick                         | ✅        |
| Anti-Nuke (Audit Logs)         | Detects dangerous actions (mass delete/create, bans, webhooks) → lockdown   | ✅        |
| Anti-Raid                      | Detects join floods → temporary channel lockdown                            | ✅        |
| Welcome Message                | Sends greeting to new verified members                                      | ✅        |
| Logging                        | All actions logged to configurable channel                                  | ✅        |

## Requirements

- Node.js **v18+** (recommended: v20 or v22)
- Discord bot token (with these intents enabled):
  - Guilds
  - Guild Members
  - Guild Messages
  - Guild Moderation
  - Message Content
  - Direct Messages
- **Privileged Gateway Intents**: Server Members, Message Content
- **Permissions**:
  - Manage Roles
  - View Audit Log
  - Send Messages
  - Embed Links
  - Read Message History
  - Moderate Members (for kicks/bans)

## Installation

1. Clone or download the repository
   ```bash
   git clone https://github.com/yourusername/secureguard-bot.git
   cd secureguard-bot
