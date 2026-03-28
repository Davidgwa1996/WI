import discord
import asyncio
from app.config import settings
from app.websocket_manager import manager

class DiscordMemberCounter(discord.Client):
    def __init__(self, guild_id):
        super().__init__(intents=discord.Intents.default())
        self.guild_id = guild_id
        self.member_count = 0

    async def on_ready(self):
        guild = self.get_guild(self.guild_id)
        if guild:
            self.member_count = guild.member_count
        await self.close()

async def fetch_member_count(guild_id):
    if not settings.DISCORD_BOT_TOKEN:
        return 0
    bot = DiscordMemberCounter(guild_id)
    await bot.start(settings.DISCORD_BOT_TOKEN)
    return bot.member_count

async def update_discord_metrics_async(project, db_session):
    if not project.discord_guild_id:
        return
    try:
        count = await fetch_member_count(int(project.discord_guild_id))
        old_members = project.discord_members
        project.discord_members = count
        if old_members:
            project.discord_growth_30d = ((count - old_members) / old_members) * 100
        db_session.commit()
        await manager.broadcast({
            "type": "discord_update",
            "project_id": project.id,
            "discord_members": count,
            "growth": project.discord_growth_30d
        })
    except Exception as e:
        print(f"Discord error for {project.name}: {e}")

def update_discord_metrics(project, db_session):
    asyncio.run(update_discord_metrics_async(project, db_session))
