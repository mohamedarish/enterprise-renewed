import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { AppDataSource } from "../../../database/appdata";
import { Freebies } from "../../../database/entities/freebies";
import { Players } from "../../../database/entities/players";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('hourly')
		.setDescription('To claim every hour'),
	async execute(interaction: CommandInteraction) {
		if (interaction.user.bot) return


		const getEntry = await AppDataSource
			.getRepository(Freebies)
			.createQueryBuilder('freebies')
			.where("freebies.user = :id", { id: interaction.user.id })
			.getOne()

		if (!getEntry) {
			return await interaction.reply({
				content: "please use join before claiming this",
				ephemeral: true
			})
		}

		const date = ((Date.now() - (Date.now() % 1000)) / 1000).toString()

		if (parseInt(getEntry.hourly) + 3600 >= parseInt(date)) {
			return await interaction.reply({
				content: "You can't do that yet as it's not been an hour yet",
				ephemeral: true
			})
		}

		const getUser = await AppDataSource
			.getRepository(Players)
			.createQueryBuilder('user')
			.where("user.id = :id", { id: interaction.user.id })
			.getOne()

		if (!getUser) return

		const money = getUser?.balance + 10

		try {
			await AppDataSource
				.createQueryBuilder()
				.update(Players)
				.set({
					balance: money
				})
				.where("id = :id", { id: interaction.user.id })
				.execute()
		} catch (error) {
			console.error(error)
		}

		try {
			await AppDataSource
				.createQueryBuilder()
				.update(Freebies)
				.set({
					hourly: date
				})
				.where("user = :user", { user: interaction.user.id })
				.execute()
		} catch (error) {
			console.error(error);
		}

		await interaction.reply("You have earned 10 coins")
	}
}