import { access, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const ROOT_DIR = join(import.meta.dir, "..");
const EVENTS_PATH = join(ROOT_DIR, "src", "events.json");

const BASE_URL = "https://fec-association.github.io/icon-frame-generator";
const GA_MEASUREMENT_ID = "G-PF8CPFDBSN";
const GA_CONTENT_GROUP = "icon-gen";
const OGP_WIDTH = 1672;
const OGP_HEIGHT = 941;
const FONT_STYLESHEET_URL =
	"https://fonts.googleapis.com/css2?family=Modak&family=Noto+Sans:wght@400;700;900&family=Noto+Sans+JP:wght@400;500;700;900&family=Roboto+Condensed:ital,wght@1,900&display=swap";

// ページは /<団体>/<年>/ に置くため、共有ファイルへは2階層上から相対参照する
const EVENT_ROOT_PATH = "../../";
const INDEX_ROOT_PATH = "./";
const FRAME_FILE_NAME = "frame.png";
const OGP_FILE_NAME = "ogp.png";

/**
 * HTMLに埋め込む文字列をエスケープする
 * @param {string} value
 * @returns {string}
 */
const escapeHtml = (value) =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");

/**
 * イベントページの公開パス（末尾スラッシュ付き）を返す
 * @param {{org: string, year: string}} event
 * @returns {string}
 */
const toEventPath = (event) => `${event.org}/${event.year}/`;

/**
 * head要素の内容をHTML文字列として組み立てる
 * @param {{rootPath: string, title: string, description: string, ogDescription: string, siteName: string, twitterSite: string | null, ogpUrl: string | null}} params
 * @returns {string}
 */
const renderHead = ({
	rootPath,
	title,
	description,
	ogDescription,
	siteName,
	twitterSite,
	ogpUrl,
}) => {
	const ogpMetas =
		ogpUrl === null
			? ""
			: `
		<meta property="og:image" content="${escapeHtml(ogpUrl)}">
		<meta property="og:image:width" content="${OGP_WIDTH}">
		<meta property="og:image:height" content="${OGP_HEIGHT}">
		<meta name="twitter:card" content="summary_large_image">
		<meta name="twitter:image" content="${escapeHtml(ogpUrl)}">`;
	const twitterSiteMeta =
		twitterSite === null
			? ""
			: `
		<meta name="twitter:site" content="${escapeHtml(twitterSite)}">`;

	return `<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>${escapeHtml(title)}</title>
		<meta name="description" content="${escapeHtml(description)}">
		<meta name="robots" content="index, follow">
		<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag() {
				dataLayer.push(arguments);
			}
			gtag("js", new Date());
			gtag("config", "${GA_MEASUREMENT_ID}", {
				content_group: "${GA_CONTENT_GROUP}",
			});
		</script>
		<meta name="theme-color" content="#0a0a0a">
		<meta property="og:title" content="${escapeHtml(title)}">
		<meta property="og:description" content="${escapeHtml(ogDescription)}">
		<meta property="og:type" content="website">
		<meta property="og:site_name" content="${escapeHtml(siteName)}">
		<meta property="og:locale" content="ja_JP">
		<meta name="twitter:title" content="${escapeHtml(title)}">
		<meta name="twitter:description" content="${escapeHtml(ogDescription)}">${twitterSiteMeta}${ogpMetas}
		<link rel="icon" href="${rootPath}favicon.ico" sizes="any">
		<link rel="icon" type="image/png" sizes="192x192" href="${rootPath}assets/android-chrome-192x192.png">
		<link rel="icon" type="image/png" sizes="32x32" href="${rootPath}assets/favicon-32x32.png">
		<link rel="icon" type="image/png" sizes="16x16" href="${rootPath}assets/favicon-16x16.png">
		<link rel="apple-touch-icon" sizes="180x180" href="${rootPath}assets/apple-touch-icon.png">
		<link rel="manifest" href="${rootPath}site.webmanifest">
		<link rel="preconnect" href="https://fonts.googleapis.com">
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		<link rel="preload" as="style" href="${FONT_STYLESHEET_URL}">
		<link href="${FONT_STYLESHEET_URL}" rel="stylesheet">
		<link rel="stylesheet" href="${rootPath}style.css">`;
};

/**
 * フレーム付きアイコンを作成するイベントページのHTMLを生成する
 * @param {{org: string, year: string, name: string, japaneseName: string, twitterSite: string, officialUrl: string, downloadFileName: string}} event
 * @returns {string}
 */
const renderEventPage = (event) => {
	const head = renderHead({
		rootPath: EVENT_ROOT_PATH,
		title: `アイコンジェネレーター | ${event.name}`,
		description: `${event.japaneseName}の公式アイコンジェネレーター。画像をアップロードして位置とサイズを調整し、SNSアイコン用の枠付き画像を作成できる。`,
		ogDescription: `${event.japaneseName}の公式アイコンジェネレーター。SNSアイコンに枠をつけよう！`,
		siteName: event.name,
		twitterSite: event.twitterSite,
		ogpUrl: `${BASE_URL}/${toEventPath(event)}${OGP_FILE_NAME}`,
	});

	return `<!doctype html>
<html lang="ja" class="scroll-smooth">
	<head>
		${head}
	</head>
	<body class="min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased">
		<header class="px-4 pt-10 pb-6 text-center">
			<p class="font-display text-accent text-4xl tracking-wider sm:text-5xl">
				ICON GENERATOR
			</p>
			<h1 class="mt-1 text-base font-bold text-neutral-700 sm:text-lg">
				${escapeHtml(event.name)}
			</h1>
			<p class="mt-2 text-xs text-neutral-500 sm:text-sm">
				画像をアップロードして、アイコンに枠をつけよう
			</p>
		</header>

		<main class="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-4 pb-16">
			<div class="relative aspect-square w-full overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-neutral-200">
				<label
					id="drop-area"
					for="file-input"
					class="absolute inset-0 z-10 flex cursor-pointer items-center justify-center border-2 border-dashed border-neutral-300 transition-colors hover:border-accent hover:bg-accent/5"
				>
					<div class="text-center">
						<p class="text-base font-bold text-neutral-700">
							タップ／クリックで画像を選択
						</p>
						<p class="mt-1 text-xs text-neutral-500">
							またはここにドラッグ＆ドロップ
						</p>
					</div>
				</label>
				<canvas
					id="preview"
					class="block h-full w-full touch-none"
					width="400"
					height="400"
					data-frame-src="${FRAME_FILE_NAME}"
					aria-label="アイコンプレビュー"
				></canvas>
				<input id="file-input" type="file" accept="image/*" class="sr-only">
			</div>

			<div id="controls" class="flex w-full flex-col gap-4" hidden>
				<div class="flex flex-col gap-2">
					<label for="scale" class="text-xs font-bold text-neutral-600">
						拡大率
					</label>
					<input
						id="scale"
						type="range"
						min="0.1"
						max="3"
						step="0.01"
						value="1"
						class="accent-accent"
					>
				</div>

				<div class="flex flex-wrap gap-2">
					<button
						id="reset-button"
						type="button"
						class="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-100"
					>
						位置とサイズをリセット
					</button>
					<button
						id="reselect-button"
						type="button"
						class="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-100"
					>
						画像を選び直す
					</button>
				</div>

				<a
					id="download"
					class="flex w-full items-center justify-center rounded-lg bg-accent px-4 py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-accent-dark"
					download="${escapeHtml(event.downloadFileName)}"
				>
					ダウンロード
				</a>
				<p class="text-center text-xs text-neutral-500">
					クリック（PC）または長押し（スマホ）で画像を保存
				</p>
			</div>

			<a
				href="${escapeHtml(event.officialUrl)}"
				class="text-xs text-neutral-500 underline-offset-4 hover:text-accent hover:underline"
			>
				公式サイトへ戻る
			</a>
		</main>

		<footer class="px-4 py-6 text-center">
			<p class="text-xs text-neutral-400">© ${escapeHtml(event.name)}</p>
		</footer>

		<script src="${EVENT_ROOT_PATH}app.js" defer></script>
	</body>
</html>
`;
};

/**
 * 対応しているイベントの一覧ページのHTMLを生成する
 * @param {{org: string, year: string, name: string}[]} events
 * @returns {string}
 */
const renderIndexPage = (events) => {
	const head = renderHead({
		rootPath: INDEX_ROOT_PATH,
		title: "アイコンジェネレーター | Frontend Conference",
		description:
			"フロントエンドカンファレンスの公式アイコンジェネレーター。イベントを選んで、SNSアイコン用の枠付き画像を作成できる。",
		ogDescription:
			"フロントエンドカンファレンスの公式アイコンジェネレーター。SNSアイコンに枠をつけよう！",
		siteName: "Frontend Conference",
		twitterSite: null,
		ogpUrl: null,
	});
	const eventLinks = events
		.map(
			(event) => `<li>
					<a
						href="${INDEX_ROOT_PATH}${toEventPath(event)}"
						class="flex w-full items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-4 text-base font-bold text-neutral-700 shadow-sm transition-colors hover:border-accent hover:text-accent"
					>
						${escapeHtml(event.name)}
					</a>
				</li>`,
		)
		.join("\n\t\t\t\t");

	return `<!doctype html>
<html lang="ja" class="scroll-smooth">
	<head>
		${head}
	</head>
	<body class="min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased">
		<header class="px-4 pt-10 pb-6 text-center">
			<p class="font-display text-accent text-4xl tracking-wider sm:text-5xl">
				ICON GENERATOR
			</p>
			<h1 class="mt-1 text-base font-bold text-neutral-700 sm:text-lg">
				Frontend Conference
			</h1>
			<p class="mt-2 text-xs text-neutral-500 sm:text-sm">
				アイコンに枠をつけるイベントを選んでください
			</p>
		</header>

		<main class="mx-auto w-full max-w-md px-4 pb-16">
			<ul class="flex flex-col gap-3">
				${eventLinks}
			</ul>
		</main>
	</body>
</html>
`;
};

/**
 * イベントページが参照するイベント固有ファイルが存在することを検証する
 * @param {{org: string, year: string}} event
 * @returns {Promise<void>}
 */
const assertEventFilesExist = async (event) => {
	const eventDir = join(ROOT_DIR, event.org, event.year);
	await Promise.all(
		[FRAME_FILE_NAME, OGP_FILE_NAME].map((fileName) =>
			access(join(eventDir, fileName)),
		),
	);
};

/**
 * HTMLファイルを書き出す
 * @param {string} relativePath
 * @param {string} html
 * @returns {Promise<string>}
 */
const writePage = async (relativePath, html) => {
	const filePath = join(ROOT_DIR, relativePath);
	await mkdir(dirname(filePath), { recursive: true });
	await Bun.write(filePath, html);
	return relativePath;
};

/**
 * 生成したHTMLをBiomeの整形ルールに揃える
 * @param {string[]} relativePaths
 * @returns {Promise<void>}
 */
const formatPages = async (relativePaths) => {
	const formatter = Bun.spawn(
		["bunx", "--bun", "biome", "format", "--write", ...relativePaths],
		{ cwd: ROOT_DIR, stdout: "inherit", stderr: "inherit" },
	);
	const exitCode = await formatter.exited;
	if (exitCode !== 0) throw new Error(`biome format failed: ${exitCode}`);
};

const events = await Bun.file(EVENTS_PATH).json();
await Promise.all(events.map(assertEventFilesExist));
const writtenPaths = await Promise.all([
	writePage("index.html", renderIndexPage(events)),
	...events.map((event) =>
		writePage(`${toEventPath(event)}index.html`, renderEventPage(event)),
	),
]);
await formatPages(writtenPaths);
