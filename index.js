require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
  Partials,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,   // For ban/kick events
    GatewayIntentBits.MessageContent,    // Required for reading messages
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// === CONFIG ===
const config = {
  verifiedRoleId: process.env.VERIFIED_ROLE_ID,
  unverifiedRoleId: process.env.UNVERIFIED_ROLE_ID,
  logChannelId: process.env.LOG_CHANNEL_ID,
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID,
  profanityLogChannelId: process.env.PROFANITY_LOG_CHANNEL_ID || process.env.LOG_CHANNEL_ID,
  timeoutMs: (parseInt(process.env.VERIFICATION_TIMEOUT_MINUTES) || 10) * 60 * 1000,
  minAccountAgeDays: parseInt(process.env.MIN_ACCOUNT_AGE_DAYS) || 3,
  maxAttempts: parseInt(process.env.MAX_CAPTCHA_ATTEMPTS) || 3,
  raidThreshold: parseInt(process.env.RAID_THRESHOLD) || 5,
  kickIfDmClosed: process.env.KICK_IF_DM_CLOSED?.toLowerCase() === 'true',
  raidLockdownMs: (parseInt(process.env.RAID_LOCKDOWN_MINUTES) || 5) * 60 * 1000,
  enableWelcome: process.env.ENABLE_WELCOME_MESSAGE?.toLowerCase() !== 'false',
  profanityEnabled: process.env.PROFANITY_FILTER_ENABLED?.toLowerCase() !== 'false',
  profanityAction: process.env.PROFANITY_ACTION || 'delete_warn',
  profanityWarnThreshold: parseInt(process.env.PROFANITY_WARN_THRESHOLD) || 3,
  blacklistIds: (process.env.BLACKLIST_USER_IDS || '').split(',').map(id => id.trim()).filter(Boolean),
  blacklistNames: (process.env.BLACKLIST_USERNAMES || '').split(',').map(n => n.trim().toLowerCase()).filter(Boolean),
};

// User warns for profanity (userId → count)
const profanityWarns = new Map();

// High-severity banned words/slurs (expand as needed!)
const bannedWords = [
  // Severe racial/ethnic slurs
  'nigger', 'nigga', 'coon', 'jewboy', 'kike', 'chink', 'gook', 'spic', 'wetback', 'beaner',
  'raghead', 'towelhead', 'sandnigger', 'paki',
  // Homophobic/transphobic
  'faggot', 'fag', 'tranny', 'trannie', 'dyke',
  // Other extreme slurs
  'retard', 'cunt', 'motherfucker', 'cocksucker',
  // Add more from reliable lists (e.g., GitHub profanity repos)
];

// Basic regex for variations (bypasses like f.u.c.k, sh!t, etc.)
function containsBannedWord(content) {
  const lower = content.toLowerCase();
  return bannedWords.some(word => {
    const regex = new RegExp(`\\b${word.replace(/([.*+?^${}()|[\]\\])/g, '\\$1')}\\b|\\b${word.split('').join('[\\W_]*')}\\b`, 'i');
    return regex.test(lower);
  });
}

// Log helper
async function sendLog(message, color = '#ff5555', channelId = config.logChannelId) {
  const channel = client.channels.cache.get(channelId);
  if (channel) {
    channel.send({ embeds: [new EmbedBuilder().setColor(color).setDescription(message).setTimestamp()] }).catch(() => {});
  }
  console.log(message);
}

// === EVENTS ===

client.once(Events.ClientReady, () => {
  console.log(`🔒 Security Bot Online → ${client.user.tag} | With Anti-Nuke + Profanity Filter + Blacklist`);
});

// Join: Blacklist check + verification (your existing code, abbreviated for space)
client.on(Events.GuildMemberAdd, async (member) => {
  if (member.user.bot) return;

  // Blacklist check
  const userId = member.id;
  const usernameLower = member.user.username.toLowerCase();
  if (config.blacklistIds.includes(userId) || config.blacklistNames.some(n => usernameLower.includes(n))) {
    await member.ban({ reason: 'Blacklisted user' }).catch(() => {});
    return sendLog(`🚫 Auto-banned blacklisted user: ${member.user.tag} (ID: ${userId})`);
  }

  // Your existing age/risk/verification logic here...
  // (Omit for brevity - keep your full join code from previous version)
});

// Profanity / Slurs Filter (only after verified - scans all messages)
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild || !config.profanityEnabled) return;

  // Optional: Only filter verified members (or everyone)
  const member = message.member;
  if (config.verifiedRoleId && !member.roles.cache.has(config.verifiedRoleId)) return;

  if (containsBannedWord(message.content)) {
    await message.delete().catch(() => {});

    const logMsg = `🚫 Deleted slur/profanity from ${message.author.tag}: "${message.content}"`;
    await sendLog(logMsg, '#ff0000', config.profanityLogChannelId);

    if (config.profanityAction.includes('warn') || config.profanityAction.includes('kick')) {
      let warns = (profanityWarns.get(message.author.id) || 0) + 1;
      profanityWarns.set(message.author.id, warns);

      if (warns >= config.profanityWarnThreshold) {
        if (config.profanityAction.includes('kick')) {
          await member.kick('Repeated use of slurs/profanity').catch(() => {});
          sendLog(`👢 Kicked ${message.author.tag} for repeated slurs (warns: ${warns})`);
        }
        profanityWarns.delete(message.author.id);
      } else {
        message.author.send(`⚠️ Warning: Your message contained prohibited language (slurs/profanity). ${config.profanityWarnThreshold - warns} warns left before action.`).catch(() => {});
        sendLog(`⚠️ Warned ${message.author.tag} (warns: ${warns})`);
      }
    }
  }
});

// Basic Anti-Nuke (watch dangerous events)
client.on(Events.ChannelDelete, async (channel) => {
  // Could check audit logs for who did it (needs VIEW_AUDIT_LOG permission)
  sendLog(`🗑️ Channel deleted: #${channel.name} (ID: ${channel.id}) - possible nuke?`);
  // Future: if mass deletes, lock permissions or alert
});

client.on(Events.RoleCreate, async (role) => {
  sendLog(`🆕 Role created: ${role.name} (ID: ${role.id}) - check for nuke`);
});

client.on(Events.GuildBanAdd, async (ban) => {
  sendLog(`🔨 User banned: ${ban.user.tag} (ID: ${ban.user.id})`);
  // Future: track ban spam
});

// Your existing InteractionCreate (button/modal/verification) code here...
// (Keep it from previous version)

client.login(process.env.TOKEN).catch(err => console.error('Login error:', err.message));