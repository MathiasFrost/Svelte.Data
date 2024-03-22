<script lang="ts">
	import { tick } from "svelte";

	interface AST {
		tag?: string;
		value?: string;
		children?: AST[];
	}

	let ast: AST[] = [{ tag: "p", children: [{ value: "Some test text test " }, { tag: "b", children: [{ value: "Oh yeah" }] }, { value: " test" }] }];

	function handleInput(e: Event): void {
		e.preventDefault();
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (!(e.target instanceof HTMLDivElement)) return;

		if (e.key === "b" && e.ctrlKey) {
			const selection = window.getSelection();
			if (!selection) return;
			e.preventDefault();
			for (let i = 0; i < selection.rangeCount; i++) {
				const range = selection.getRangeAt(0);
				if (range.commonAncestorContainer !== e.target && !e.target.contains(range.commonAncestorContainer)) continue;

				const [startAst, endAst] = getAST(range, Array.from(e.target.childNodes));
				if (!startAst || !endAst) return;

				const end = range.startContainer === range.endContainer ? range.endOffset : startAst.value?.length ?? 0;

				const before = startAst.value?.substring(0, range.startOffset);

				const slice: string | undefined = startAst.value?.substring(range.startOffset, end);
				startAst.children ??= [];
				startAst.children.push({ tag: "b", children: [{ value: slice }] });

				const after = startAst.value?.substring(end);

				startAst.value = before;
				startAst.children.push({ value: after });
				ast = ast;
				tick().then(() => {
					const selection = window.getSelection();
					selection?.addRange(range);
				});
			}
		}
	}

	function getAST(range: Range, childNodes: Node[]): [AST | null, AST | null] {
		let startAst: AST | null = null;
		let endAst: AST | null = null;

		function deBuild(node: Node, ast: AST): void {
			if (node === range.startContainer) startAst = ast;
			if (node === range.endContainer) endAst = ast;
			let i = 0;
			for (let child of node.childNodes) {
				deBuild(child, ast.children![i]);
				i++;
			}
		}

		let i = 0;
		for (let child of childNodes) {
			deBuild(child, ast[i]);
			i++;
		}

		return [startAst, endAst];
	}

	function renderAST(ast: AST[]): string {
		let builder = "";

		function build(ast: AST): void {
			if (ast.tag) builder += `<${ast.tag}>`;
			if (ast.value) builder += ast.value;
			ast.children?.forEach((a) => build(a));
			if (ast.tag) builder += `</${ast.tag}>`;
		}

		ast.forEach((a) => build(a));

		return builder;
	}
</script>

<div class="container" contenteditable role="textbox" tabindex="0" on:input={handleInput} on:keydown={handleKeydown}>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html renderAST(ast)}
</div>

<style lang="scss">
	.container {
		padding: 1rem;
		border: 1px solid gray;
	}
</style>
