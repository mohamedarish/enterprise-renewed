import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { AppDataSource } from "../../../database/appdata";
import { Freebies } from "../../../database/entities/freebies";
import { Players } from "../../../database/entities/players";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('yearly')
		.setDescription('To claim every year'),
	async execute(interaction: CommandInteraction) {
		if (interaction.user.bot) return

		
		const getEntry = await AppDataSource
			.getRepository(Freebies)
			.createQueryBuilder('freebies')
			.where("freebies.user = :id", {id: interaction.user.id})
			.getOne()
		
		if (!getEntry) {
			return interaction.reply({
				content: "please use join before claiming this",
				ephemeral: true
			})
		}

		const date = ((Date.now() - (Date.now() % 1000) ) / 1000).toString()

		if ( parseInt(getEntry.yearly) + 31557600 >= parseInt(date)) {
			return interaction.reply({
				content: "You can't do that yet as it's not been a year yet",
				ephemeral: true
			})
		}

		const getUser = await AppDataSource
			.getRepository(Players)
			.createQueryBuilder('user')
			.where("user.id = :id", {id: interaction.user.id})
			.getOne()

		if (!getUser) return

		const money = getUser?.balance + 5000

		await AppDataSource
			.createQueryBuilder()
			.update(Players)
			.set({
				balance: money
			})
			.where("id = :id", {id: interaction.user.id})
			.execute()

		try {
			await AppDataSource
				.createQueryBuilder()
				.update(Freebies)
				.set({
					yearly: date
				})
				.where("user = :user", {user: interaction.user.id})
				.execute()
		} catch (error) {
			console.error(error);
		}

		interaction.reply("You have earned 5000 coins")
	}
}