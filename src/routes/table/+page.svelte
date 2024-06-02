<script lang="ts">
	import TableGroup from "$lib/table/TableGroup.svelte";
	import Indent from "$lib/table/Indent.svelte";

	interface IData {
		readonly id: number;
		readonly name: string;
		readonly age: number;
		readonly city: string;
	}

	function getRandomName(): string {
		const names = ["Alice", "Bob", "Carol", "Dave", "Eve", "Frank", "Grace", "Helen", "Ian", "Julia"];
		return names[Math.floor(Math.random() * names.length)];
	}

	function getRandomCity(): string {
		const names = ["Oslo", "Montevideo", "New York"];
		return names[Math.floor(Math.random() * names.length)];
	}

	function getRandomAge(): number {
		return Math.floor(Math.random() * 100);
	}

	const data: IData[] = Array.from({ length: 10 }, (_, index) => ({
		name: getRandomName(),
		age: getRandomAge(),
		city: getRandomCity(),
		id: index + 1
	}));
</script>

<table>
	<thead>
		<tr>
			<th>Id</th>
			<th>Name</th>
			<th>Age</th>
			<th>City</th>
		</tr>
	</thead>
	<tbody>
		<TableGroup groups={{ City: (el) => el.city, Name: (el) => el.name }} {data} let:grouped>
			{#each grouped as group}
				<tr>
					<th colspan="4"><Indent i={group.level} />{group.key}: {group.value} <em>({group.count})</em></th>
				</tr>
				{#each group.data as datum}
					<tr>
						<td><Indent i={group.level} />{datum.id}</td>
						<td>{datum.name}</td>
						<td>{datum.age}</td>
						<td>{datum.city}</td>
					</tr>
				{/each}
			{/each}
		</TableGroup>
	</tbody>
</table>

<style lang="scss">
	/* General table styles */
	table {
		width: 100%; /* Full-width */
		border-collapse: collapse; /* No space between borders */
		font-family: Arial, sans-serif; /* Modern font */
		color: #ccc; /* Light grey text for readability */
		background-color: #333; /* Dark grey background */
	}

	table th,
	table td {
		padding: 12px 15px; /* Spacing inside cells */
		border: 1px solid #444; /* Slightly lighter border color */
		text-align: left; /* Align text to the left */
	}

	/* Header styles */
	table thead th {
		background-color: #222; /* Darker background for the header */
		color: #fff; /* White text for contrast */
	}

	/* Hover effect for rows */
	table tbody tr:hover {
		background-color: #555 !important; /* Lighter grey for hover */
	}

	/* Zebra striping for rows */
	table tbody tr:nth-child(odd) {
		background-color: #393939; /* Even darker grey for alternate rows */
	}
</style>
