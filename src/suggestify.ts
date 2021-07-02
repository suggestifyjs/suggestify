/*! Copyright (c) 2021 - Max van der Schee
 * Licensed MIT
 */
import './style.scss';
import { nanoid } from 'nanoid';
import { sanitize, switchFn } from './utils';
import { levenshtein } from './utils/algorithms';

export interface Options {
	url?: string;
	engine?: string;
	class?: string;
	translations?: Translations;
}

export interface Translations {
	suggestions: string;
	linkLabel: string;
	results: string;
}

export interface Cache {
	[key: string]: Result;
}

export interface Result {
	type: 'results' | 'suggestions';
	items: string[];
}

const MIN_DISTANCE = 2;

class Suggestify {
	private root: HTMLElement | null;
	private engine: string;
	private class: string;
	private url: string;
	private input?: HTMLInputElement | null;
	private list?: HTMLElement | null;
	private translations: Translations | null;
	private cache: Cache = {};
	private searchInput: string | null;
	private timeout = 250;

	constructor(selector: string | HTMLElement, options: Options) {
		this.root = typeof selector === 'string' ? document.querySelector(selector) : selector;
		this.url = options.url || '?q=';
		this.class = options.class || 'suggestify';
		this.searchInput = null;
		this.translations = options.translations || null;
		this.engine = options.engine || '/api/search';
		this.input = this.root?.querySelector('input');
		this.list = this.root?.querySelector('ul');

		if (this.root) this.initialize();

		this.test();
	}

	test(): void {
		const list = {
			match: [],
			alt: [],
		};
		let results = [];

		let matchCount: number = 0;
		let altCount: number = 0;
		const cap = 8;
		const searchText = 't';

		// total results is 8
		// 0: first character of word match
		// 1: any character of word match
		// 2: first character of any word
		// 3: any character of any word
		// 4: possible alternatives

		const wordsMatch = (item) => {
			const reg = new RegExp(searchText.replace(/\W+/g, '|'), 'ig');

			if (reg.test(item)) {
				matchCount++;
				list['match'].push(item);
			}
		};

		const AltMatch = (item) => {
			const distance = levenshtein(item.toLowerCase(), searchText);
			if (distance <= MIN_DISTANCE) {
				altCount++;
				list['alt'].push(item);
			}
		};

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			wordsMatch(item);
			if (altCount !== cap) AltMatch(item);
			if (matchCount === cap) break;
		}

		this.sortResults(list['match'], searchText);

		const sortMatches = this.sortResults(list['match'], searchText);

		results = new Set([...sortMatches, ...list['alt'].sort()]);

		console.log(sortMatches, list['alt']);
	}

	sortResults(list, searchText) {
		const results = [];
		const full = new RegExp(searchText, 'i');
		const par = new RegExp(`${searchText.replace(/\W+/g, '|')}`, 'i');
		const unsortedlist = {};

		const unfilterd = list
			.sort()
			.filter((item) => {
				const m = full.exec(item);
				if (m && m.index === 0) {
					results.push(item);
					return false;
				} else return true;
			})
			.filter((item) => {
				if (full.test(item)) {
					results.push(item);
					return false;
				} else return true;
			})
			.filter((item) => {
				const m = par.exec(item);
				if (m) {
					unsortedlist[item] = m.index;
					return false;
				} else return true;
			});

		const sortedList = Object.keys(unsortedlist).sort((a, b) => {
			return unsortedlist[a] - unsortedlist[b];
		});

		return [...results, ...sortedList, ...unfilterd];
	}

	initialize(): void {
		const i = document.createElement('i');
		i.setAttribute('role', 'presentation');
		i.setAttribute('focusable', 'false');
		i.setAttribute('aria-hidden', 'true');
		i.className = `${this.class}-icon`;
		this.root?.insertBefore(i, this.root?.childNodes[0]);

		if (this.input && this.list) {
			this.input.setAttribute('role', 'combobox');
			this.input.setAttribute('autocomplete', 'off');
			this.input.setAttribute('autocapitalize', 'off');
			this.input.setAttribute('autocorrect', 'off');
			this.input.setAttribute('spellcheck', 'false');
			this.input.setAttribute('aria-autocomplete', 'list');
			this.input.setAttribute('aria-haspopup', 'listbox');
			this.input.setAttribute('aria-expanded', 'false');
			this.input.className = `${this.class}-input`;

			this.searchInput = this.input.value;

			this.list.setAttribute('role', 'listbox');
			this.list.className = `${this.class}-result`;
			if (!this.list.id) this.list.id = `${this.class}-result-${nanoid(5)}`;

			this.input.setAttribute('aria-owns', this.list.id);
			this.input.addEventListener('input', this.searchHandler, { passive: true });
			this.input.addEventListener('click', this.inputSelected, { passive: true });
			this.input.addEventListener('keydown', this.keyHandler, { passive: true });
			this.input.addEventListener('mouseover', this.autoSuggest, { once: true, passive: true });
			this.input.addEventListener('blur', this.handleBlur, { passive: true });

			const pre = document.createElement('link');
			pre.setAttribute('rel', 'preconnect');
			pre.href = this.engine;

			document.body.appendChild(pre);
		}
	}

	/**
	 * @description Calls server for initial suggestions
	 * @returns void
	 */
	autoSuggest = (): void => {
		this.request(this.searchInput).catch((e: Error) => {
			throw new Error(e.message);
		});
	};

	/**
	 * @description Deletes results items on blur
	 * @returns void
	 */
	handleBlur = (): void => {
		setTimeout(() => {
			this.DeleteResultList();
		}, 100);
	};

	/**
	 * @description Show list on click
	 * @returns void
	 */
	inputSelected = (): void => {
		this.request(this.searchInput)
			.then((response) => {
				this.DeleteResultList();
				this.createResultList(response);
			})
			.catch((e: Error) => {
				throw new Error(e.message);
			});
	};

	EnterHandler = () => {
		if (this.searchInput) window.location.href = `${this.url}${this.searchInput}`;
	};

	keyHandler = ({ key }: KeyboardEvent): void => {
		const cases = {
			Enter: this.EnterHandler,
			Escape: this.DeleteResultList,
			_default: () => null,
		};
		const keySwitch = switchFn(cases, '_default');

		keySwitch(key);
	};

	/**
	 * @description Handle new search input with call to server
	 * @returns void
	 */
	searchHandler = ({ target }: Event): void => {
		const input = (target as HTMLInputElement).value;
		this.searchInput = input ? sanitize(input) : null;

		if (this.timeout) clearTimeout(this.timeout);
		this.timeout = setTimeout(() => {
			this.request(this.searchInput)
				.then((response) => {
					this.DeleteResultList();
					this.createResultList(response);
				})
				.catch((e: Error) => {
					throw new Error(e.message);
				});
		}, 250);
	};

	/**
	 * @description Deletes results items on blur
	 * @returns void
	 */
	async request(search: string | null): Promise<Result> {
		const cacheKey = JSON.stringify(search);
		if (this.cache[cacheKey]) return this.cache[cacheKey];

		const options = {
			method: 'POST',
			body: JSON.stringify({
				search,
			}),
		};

		const response: Result = await fetch(this.engine, options).then((response) => response.json());
		this.cache[cacheKey] = response;

		console.log(response);

		return response;
	}

	createResultList(result: Result): void {
		this.root!.classList.add('expanded');
		this.input!.setAttribute('aria-expanded', 'true');

		if (result.items.length) {
			if (result.type === 'suggestions') {
				const li = document.createElement('li');
				li.className = `${this.class}-banner`;
				li.textContent = this.translations?.suggestions ? this.translations?.suggestions : 'Suggestions:';
				this.list!.appendChild(li);
			}

			for (let i = 0; i < result.items.length; i++) {
				const item = result.items[i];
				const li = document.createElement('li');
				const a = document.createElement('a');

				a.className = `${this.class}-link`;
				a.setAttribute(
					'aria-label',
					`${this.translations?.linkLabel ? this.translations?.linkLabel : 'Search on'} ${item}`
				);
				a.href = `${this.url}${item}`;
				a.textContent = item;

				li.appendChild(a);
				this.list!.appendChild(li);
			}
		} else {
			if (result.type === 'results') {
				const banner = document.createElement('li');
				const li = document.createElement('li');
				const a = document.createElement('a');

				banner.className = `${this.class}-banner`;
				banner.textContent = this.translations?.results ? this.translations?.results : 'No suggestions found';

				a.className = `${this.class}-link`;
				a.setAttribute(
					'aria-label',
					`${this.translations?.linkLabel ? this.translations?.linkLabel : 'Search on'} ${this.searchInput}`
				);
				a.href = `${this.url}${this.searchInput}`;
				a.textContent = this.searchInput;

				li.appendChild(a);
				this.list!.appendChild(banner);
				this.list!.appendChild(li);
			}
		}
	}

	DeleteResultList = (): void => {
		this.root!.classList.remove('expanded');
		this.input!.setAttribute('aria-expanded', 'false');
		this.list!.innerHTML = '';
	};
}

export default Suggestify;

const items = [
	'Wallaby, tammar',
	'Gerenuk',
	'Oryx, fringe-eared',
	'Fat-tailed dunnart',
	'Red-shouldered glossy starling',
	'Southern boubou',
	'Wild turkey',
	'Mourning collared dove',
	'Snake, eastern indigo',
	'Blue catfish',
	'Greater roadrunner',
	'Orca',
	'Goose, knob-nosed',
	'Lourie, grey',
	'Greater sage grouse',
	'Black-collared barbet',
	'Capuchin, weeper',
	'Crown of thorns starfish',
	'Striated heron',
	'Bustard, kori',
	'Greater blue-eared starling',
	"Burchell's gonolek",
	'White-fronted bee-eater',
	'Dove, laughing',
	'Whale, baleen',
	'Duck, blue',
	'Fox, north american red',
	'Jabiru stork',
	'Sheep, stone',
	'Trumpeter, dark-winged',
	'Pintail, bahama',
	'Sheep, american bighorn',
	'Alligator, american',
	'Stanley bustard',
	'Fringe-eared oryx',
	'Pelican, great white',
	'Large-eared bushbaby',
	'Honey badger',
	'Badger, eurasian',
	'Moccasin, water',
	'Caracara, yellow-headed',
	'Huron',
	'Egyptian goose',
	'Phascogale, red-tailed',
	'Black-fronted bulbul',
	'Owl, australian masked',
	'Deer, red',
	'Turkey vulture',
	'Quoll, spotted-tailed',
	'Skink, african',
	'Eagle, golden',
	'Long-necked turtle',
	'Beaver, north american',
	'Salmon pink bird eater tarantula',
	'Common long-nosed armadillo',
	'Rat, arboral spiny',
	'Black kite',
	'Crow, house',
	'Red hartebeest',
	'Weaver, lesser masked',
	'Brown antechinus',
	'Eagle, bateleur',
	'Waterbuck, defassa',
	'Lapwing, southern',
	'Tortoise, desert',
	'Grenadier, common',
	'Saddle-billed stork',
	'Boar, wild',
	'Worm snake (unidentified)',
	'Colobus, black and white',
	'Golden eagle',
	'Lion, african',
	'Common nighthawk',
	'Russian dragonfly',
	'Mockingbird, galapagos',
	'Elephant, african',
	'Kiskadee, great',
	"Thomson's gazelle",
	'Rock dove',
	'Bulbul, black-eyed',
	'Topi',
	'Great cormorant',
	'Dove, little brown',
	'Grenadier, purple',
	'Short-nosed bandicoot',
	'Woodpecker, downy',
	'Blackbird, red-winged',
	'Stork, marabou',
	'White-browed owl',
	'Cliffchat, mocking',
	'Antelope, roan',
	'Greater flamingo',
	'Partridge, coqui',
	'Kingfisher, pied',
	'Pheasant, ring-necked',
	"Gonolek, burchell's",
	'Tern, royal',
	'Hartebeest, red',
	'Bison, american',
	'Black-throated butcher bird',
	'Old world fruit bat (unidentified)',
	'Coatimundi, ring-tailed',
	'Pied butcher bird',
	'Waxbill, violet-eared',
	'Gelada baboon',
	'Goliath heron',
	'Anaconda (unidentified)',
	'Corella, long-billed',
	'Squirrel, golden-mantled ground',
	'Fox, grey',
	'Lizard, mexican beaded',
	'White-bellied sea eagle',
	'Squirrel, eurasian red',
	'Cat, jungle',
	'Yellow-bellied marmot',
	'Crane, sarus',
	'Otter, african clawless',
	'Euro wallaby',
	'Dusky rattlesnake',
	'Blesbok',
	'Stork, yellow-billed',
	'Shelduck, european',
	'Fisher',
	'Lizard, collared',
	'Australian sea lion',
	'Civet, small-toothed palm',
	'Groundhog',
	'Ibis, sacred',
	'White-winged tern',
	'South American sea lion',
	'Common zorro',
	'Black-winged stilt',
	'Horned rattlesnake',
	'Porcupine, african',
	'Curve-billed thrasher',
	'Peacock, blue',
	'Starling, red-shouldered glossy',
	'Hyena, striped',
	'Crake, african black',
	'Civet (unidentified)',
	'Egyptian cobra',
	'Canadian river otter',
	'Grey phalarope',
	'Porcupine, crested',
	'Baboon, savanna',
	"Gazelle, thomson's",
	'Alligator, mississippi',
	'Dragon, western bearded',
	'Viper, egyptian',
	'Sally lightfoot crab',
	'Puku',
	'Purple grenadier',
	'Nighthawk, common',
	'Wapiti, elk,',
	'African black crake',
	'Red kangaroo',
	'Lizard, giant girdled',
	'Mississippi alligator',
	'Lesser double-collared sunbird',
	'Common rhea',
	'Meerkat, red',
	'Glossy starling (unidentified)',
	'Rat, desert kangaroo',
	'Dove, ring',
	'Oriental white-backed vulture',
	'Raven, cape',
	'Tenrec, tailless',
	'Racer snake',
	'Iguana, marine',
	'Cobra, egyptian',
	'Gazer, sun',
	'American marten',
	'Woodchuck',
	'European spoonbill',
	'Openbill, asian',
	'Glossy ibis',
	'Blue peacock',
	'Flightless cormorant',
	'Greylag goose',
	'Eastern boa constrictor',
	'Sun gazer',
	'Black bear',
	'Black-throated cardinal',
	'American alligator',
	'Eastern indigo snake',
	'Plover, blacksmith',
	'Shark, blue',
	'Penguin, galapagos',
	'Turtle, long-necked',
	'White-faced tree rat',
	'Genoveva',
	'Emerald green tree boa',
	'Eagle owl (unidentified)',
	'Jackal, asiatic',
	'Cape raven',
	'Southern black-backed gull',
	'Kangaroo, eastern grey',
	'Amazon parrot (unidentified)',
	'Fork-tailed drongo',
	'Devil, tasmanian',
	'Sandgrouse, yellow-throated',
	'Burmese brown mountain tortoise',
	'Opossum, american virginia',
	'Owl, burrowing',
	'Elephant, asian',
	'Boa, columbian rainbow',
	'Common wolf',
	'Armadillo, nine-banded',
	"Nutcracker, clark's",
	'Chimpanzee',
	'Cormorant, pied',
	'African porcupine',
	'Argalis',
	'Stone sheep',
	'Red brocket',
	'White-headed vulture',
	'White-nosed coatimundi',
	'Yellow mongoose',
	'Lizard, goanna',
	'Dromedary camel',
	'Lion, california sea',
	'Shrike, common boubou',
	'Ring-tailed lemur',
	'Bleu, blue-breasted cordon',
	'Long-tailed jaeger',
	'Pine snake (unidentified)',
	'Owl, great horned',
	'Indian star tortoise',
	'Heron, goliath',
	'Sunbird, lesser double-collared',
	'Lizard, blue-tongued',
	'Goose, andean',
	'Blue racer',
	'Jaguarundi',
	'Indian red admiral',
	'Badger, american',
	'Tern, arctic',
	'Pintail, white-cheeked',
	'Tapir, brazilian',
	'Common dolphin',
	'Southern right whale',
	'Knob-nosed goose',
	'Black-backed jackal',
	'Raccoon, common',
	'Yellow-throated sandgrouse',
	'Mongoose, yellow',
	'Albatross, galapagos',
	'Dama wallaby',
	'Toucan, white-throated',
	'Cape wild cat',
	"Bustard, denham's",
	'Cockatoo, roseate',
	'Tropical buckeye butterfly',
	'American buffalo',
	'Crowned eagle',
	'Squirrel, thirteen-lined',
	'Blackbuck',
	'Flicker, campo',
	'North American red fox',
	'Four-striped grass mouse',
	'Desert spiny lizard',
	'Turkey, common',
	'Black-capped chickadee',
	'Australian brush turkey',
	'Penguin, little blue',
	'Arctic lemming',
	'Hawk-eagle, crowned',
	'Kangaroo, jungle',
	'Oribi',
	'Square-lipped rhinoceros',
	'Gull, dusky',
	'Cockatoo, slender-billed',
	'Snake, racer',
	'Galapagos tortoise',
	'Gerbil (unidentified)',
	'Australian masked owl',
	'Indian giant squirrel',
	'Griffon vulture',
	'Turaco, violet-crested',
	'Fox, arctic',
	'Tiger snake',
	"Francolin, swainson's",
	'Roan antelope',
	'Porcupine, indian',
	'Potoroo',
	'American beaver',
	'Australian spiny anteater',
	'Striped skunk',
	'Kookaburra, laughing',
	'Booby, blue-faced',
	'Golden-mantled ground squirrel',
	'Asian foreset tortoise',
	'Serval',
	'Fox, crab-eating',
	'Turtle, snake-necked',
	'Slender loris',
	'Starfish, crown of thorns',
	'Thirteen-lined squirrel',
	'Little cormorant',
	'Western palm tanager (unidentified)',
	'Common seal',
	'Swan, trumpeter',
	'Yellow-crowned night heron',
	'Heron, striated',
	"Steller's sea lion",
	'Chickadee, black-capped',
	'Snowy owl',
	"Wallaby, bennett's",
	'Galapagos mockingbird',
	'Blue fox',
	'Stilt, black-winged',
	'Zorro, common',
	'Flamingo, roseat',
	'Long-nosed bandicoot',
	'Tiger cat',
	'Crested porcupine',
	'Little brown dove',
	'Kalahari scrub robin',
	'Cormorant, large',
	'Wallaby, whip-tailed',
	'Eagle, crowned',
	'Sandhill crane',
	'Tiger',
	'Pademelon, red-legged',
	'Slender-billed cockatoo',
	'Possum, common brushtail',
	'Cape fox',
	'Campo flicker',
	'Brocket, red',
	'African snake (unidentified)',
	'Chestnut weaver',
	'Sloth, two-toed tree',
	'Woodrat (unidentified)',
	'Spotted deer',
	'Constrictor, eastern boa',
	'Ibex',
	'Cat, kaffir',
	'Camel, dromedary',
	'Tokay gecko',
	'Snake (unidentified)',
	'White-necked raven',
	'Bird (unidentified)',
	'Eastern cottontail rabbit',
	'Black-tailed prairie dog',
	'Hawk-headed parrot',
	'Brown and yellow marshbird',
	'African wild dog',
	'Vulture, black',
	'Penguin, magellanic',
	'Crane, blue',
	'Woodpecker, red-headed',
	'Wallaby, euro',
	'Common melba finch',
	'Marmot, hoary',
	'Tortoise, asian foreset',
	'Capybara',
	'Armadillo, common long-nosed',
	'Rhinoceros, black',
	'Bird, pied butcher',
	'Thrasher, curve-billed',
	'Harbor seal',
	'Guanaco',
	'Savanna fox',
	'American crow',
	'Red-tailed phascogale',
	'Butterfly, canadian tiger swallowtail',
	'Iguana, common green',
	'Reindeer',
	'Monkey, vervet',
	'Lilac-breasted roller',
	'Red howler monkey',
	'Yellow-billed hornbill',
	'Deer, savannah',
	'Royal tern',
	'Eland, common',
	'Kori bustard',
	'Ring-tailed coatimundi',
	'Gray langur',
	'Asian lion',
	'Barasingha deer',
	'Fox, savanna',
	'Malay squirrel (unidentified)',
	'Grison',
	'Springhare',
	'Squirrel, eastern fox',
	'Dog, african wild',
	'Shrike, southern white-crowned',
	'Flicker, field',
	'Lark, horned',
	'Cape Barren goose',
	'Civet cat',
	'Western spotted skunk',
	'Lory, rainbow',
	'Sportive lemur',
	'Lion, galapagos sea',
	'Butterfly, tropical buckeye',
	'Sparrow, house',
	'Black spider monkey',
	'Whale, killer',
	'Bahama pintail',
	'Possum, western pygmy',
	'Tsessebe',
	'Dove, galapagos',
	'Grebe, little',
	'Red-billed tropic bird',
	'Raccoon, crab-eating',
	'Common raccoon',
	'Pygmy possum',
	'Tayra',
	'Macaque, bonnet',
	'Silver-backed jackal',
	'South American meadowlark (unidentified)',
	'Siskin, yellow-rumped',
	'Wild boar',
	'Laughing kookaburra',
	'Blue-breasted cordon bleu',
	'Crane, sandhill',
	'Chital',
	'Pied avocet',
	'Baleen whale',
	'Woylie',
	'Pronghorn',
	'Sarus crane',
	'Beaver, european',
	'Mocking cliffchat',
	'Bengal vulture',
	'Chilean flamingo',
	"Hoffman's sloth",
	'Swallow (unidentified)',
	'Blue duck',
	'Hen, sage',
	'Bontebok',
	'Emu',
	'Jacana, african',
	'Rattlesnake, horned',
	'Palm squirrel',
	'Jackrabbit, white-tailed',
	'Common waterbuck',
	'Albatross, waved',
	'Columbian rainbow boa',
	'Snowy egret',
	'Gray duiker',
	"Clark's nutcracker",
	'Sidewinder',
	'Phascogale, brush-tailed',
	'Falcon, peregrine',
	'King cormorant',
	'Nilgai',
	'Sloth bear',
	'Bandicoot, long-nosed',
	'Common palm civet',
	'Greater kudu',
	'Javan gold-spotted mongoose',
	'Tortoise, burmese black mountain',
	'Mountain goat',
	'Weaver, chestnut',
	'Giant heron',
	'Canadian tiger swallowtail butterfly',
	'Gray rhea',
	'Langur, hanuman',
	'Antelope, four-horned',
	'Dabchick',
	'Dragonfly, russian',
	'Lily trotter',
	'Leopard',
	'Teal, hottentot',
	'Tamandua, southern',
	'Common goldeneye',
	'Cormorant, little',
	'White-fronted capuchin',
	'Indian jackal',
	'Skink, blue-tongued',
	'Pine squirrel',
	'Colobus, magistrate black',
	'Gull, southern black-backed',
	'Ass, asiatic wild',
	'Snow goose',
	'Hornbill, yellow-billed',
	'Long-tailed skua',
	'Deer, white-tailed',
	'Goldeneye, barrows',
	'Asian false vampire bat',
	'Crab-eating raccoon',
	'Duck, comb',
	'Elegant crested tinamou',
	'Butterfly (unidentified)',
	'Hornbill, red-billed',
	'Painted stork',
	'Black-crowned crane',
	'Marten, american',
	'South American puma',
	'White-winged black tern',
	'Vulture, lappet-faced',
	'Cape white-eye',
	'Black rhinoceros',
	'Frilled dragon',
	'Suricate',
	'Common shelduck',
	'Galapagos sea lion',
	'Dove, white-winged',
	'Cormorant, great',
	'Skua, long-tailed',
	'Pocket gopher (unidentified)',
	"Barbet, levaillant's",
	'Prehensile-tailed porcupine',
	'Hornbill, southern ground',
	'Stork, european',
	'Monitor, two-banded',
	'Blue wildebeest',
	'Downy woodpecker',
	'Scarlet macaw',
	'Short-beaked echidna',
	'Lesser mouse lemur',
	'Flycatcher, tyrant',
	'Stork, painted',
	'House sparrow',
	'Cat, ringtail',
	'Brown brocket',
	'Cormorant, flightless',
	'Scottish highland cow',
	'Macaw, green-winged',
	'Gecko, barking',
	'Magellanic penguin',
	'Fox, bat-eared',
	'African lion',
	'Macaque, rhesus',
	'White-throated monitor',
	'Salmon, sockeye',
	'Langur, common',
	'Southern sea lion',
	'White-lipped peccary',
	'Bird, secretary',
	'Bat-eared fox',
	'Creeper, black-tailed tree',
	'Macaw, scarlet',
	'European beaver',
	'Seven-banded armadillo',
	'Indian mynah',
	'Burrowing owl',
	'Osprey',
	'Seal, harbor',
	'Genet, common',
	'Tortoise, radiated',
	'Gecko (unidentified)',
	'Common green iguana',
	'Cardinal, black-throated',
	'Red-tailed wambenger',
	'Toddy cat',
	'Otter, north american river',
	"Zorro, azara's",
	'Common duiker',
	'Common langur',
	"Denham's bustard",
	'Ant (unidentified)',
	'Bare-faced go away bird',
	'Red-billed buffalo weaver',
	'Goanna lizard',
	'Long-tailed spotted cat',
	'Common mynah',
	'Margay',
	'Lemming, arctic',
	'Goose, greylag',
	'Screamer, crested',
	'Asiatic wild ass',
	'Whip-tailed wallaby',
	'Bateleur eagle',
	'Ibis, glossy',
	'Black swan',
	'Swamp deer',
	'White-tailed jackrabbit',
	'King vulture',
	'Common wallaroo',
	'Badger, honey',
	'Bent-toed gecko',
	'Rainbow lory',
	'Bandicoot, southern brown',
	'Cape starling',
	'Ground legaan',
	'Cockatoo, red-breasted',
	'Ostrich',
	'Bettong, brush-tailed',
	'Cobra, cape',
	"Kirk's dik dik",
	'Gorilla, western lowland',
	'Coatimundi, white-nosed',
	'White stork',
	'Cockatoo, long-billed',
	'Tern, white-winged',
	'Arboral spiny rat',
	'Olive baboon',
	'Galapagos dove',
	'Galapagos hawk',
	'Duck, white-faced whistling',
	'Cougar',
	'Guerza',
	'Ocelot',
	'Polecat, african',
	'Pale white-eye',
	'Grey heron',
	'Seal, southern elephant',
	'Spectacled caiman',
	'Baboon, olive',
	'Onager',
	'Deer, black-tailed',
	'Red-breasted cockatoo',
	'Lappet-faced vulture',
	'Glider, feathertail',
	'Violet-crested turaco',
	'Mongoose, eastern dwarf',
	'Sage hen',
	'Red lava crab',
	'Squirrel, pine',
	'Bald eagle',
	'Woodcock, american',
	'Black-backed magpie',
	'Lizard (unidentified)',
	'African ground squirrel (unidentified)',
	'Puffin, horned',
	'Monkey, bleeding heart',
	'Crane, wattled',
	'Glider, sugar',
	'Collared lemming',
	'Monkey, rhesus',
	'Crab, sally lightfoot',
	'Bird, magnificent frigate',
	"Miner's cat",
	'White spoonbill',
	'Ring-tailed gecko',
	'Squirrel, indian giant',
	'Green-backed heron',
	'Bird, bare-faced go away',
	'Beaver, eurasian',
	'Moorhen, purple',
	'Wombat, southern hairy-nosed',
	'Porcupine, north american',
	'Grouse, sage',
	'Woolly-necked stork',
	'Indian tree pie',
	'Monitor, white-throated',
	'Mallard',
	'Timber wolf',
	'Black-capped capuchin',
	'Brindled gnu',
	'Cottonmouth',
	'Urial',
	'Common eland',
	'Paca',
	'Mongoose, javan gold-spotted',
	'Blue and gold macaw',
	'Heron, little',
	'Otter, canadian river',
	'Chipmunk, least',
	'Anteater, australian spiny',
	'Marabou stork',
	'Lion, south american sea',
	'Crested screamer',
	'Peccary, white-lipped',
	'Uinta ground squirrel',
	'Flamingo, lesser',
	'Cormorant, javanese',
	"Hartebeest, coke's",
	'Bat, asian false vampire',
	'Cat, cape wild',
	'Possum, pygmy',
	'Squirrel, arctic ground',
	'Seal, northern elephant',
	'Dragon, ornate rock',
	'Indian peacock',
	'Whale, long-finned pilot',
	'Eastern box turtle',
	'Crab-eating fox',
	"Azara's zorro",
	'Pigeon, feral rock',
	'Northern elephant seal',
	'Common turkey',
	'Asian openbill',
	'White-necked stork',
	'White-throated kingfisher',
	'Arctic tern',
	'Wolf, timber',
	'Brown lemur',
	'Sungazer, yellow-brown',
	'Silver-backed fox',
	'House crow',
	'Gila monster',
	'Magnificent frigate bird',
	'Tyrant flycatcher',
	'River wallaby',
	'Ring-tailed possum',
	'Savannah deer',
	'Wolf, mexican',
	'Dingo',
	'Sambar',
	'Goose, egyptian',
	'White-cheeked pintail',
	'Spotted hyena',
	'African skink',
	'White-throated toucan',
	'Small-spotted genet',
	'Hawk, red-tailed',
	'Capuchin, white-fronted',
	'Coyote',
	'African lynx',
	'Dolphin, bottle-nose',
	'Deer, mule',
	'Galapagos albatross',
	'Radiated tortoise',
	'Skimmer, four-spotted',
	'Cuis',
	'Asian water buffalo',
	'Turtle (unidentified)',
	"Lion, steller's sea",
	'Kinkajou',
	'Field flicker',
	'Red-breasted nuthatch',
	'Stanley crane',
	'Eurasian hoopoe',
	'Canada goose',
	'Spoonbill, white',
	'Brown hyena',
	'Black-necked stork',
	'Barbet, black-collared',
	"Squirrel, smith's bush",
	'Western pygmy possum',
	'Cormorant, neotropic',
	'Boa, malagasy ground',
	'Francolin, coqui',
	'Snake, western patch-nosed',
	'Turkey, australian brush',
	'Common boubou shrike',
	'Kaffir cat',
	'White-mantled colobus',
	'Plover, three-banded',
	'Seal, northern fur',
	'Black-tailed tree creeper',
	'African bush squirrel',
	'Heron, yellow-crowned night',
	'Rat, white-faced tree',
	'Dove, rock',
	'Prairie falcon',
	'Ibis, puna',
	'Rhea, greater',
	'Pacific gull',
	'Deer, spotted',
	'Tortoise, burmese brown mountain',
	'Deer, roe',
	'Red-capped cardinal',
	'Green-winged macaw',
	'Squirrel, uinta ground',
	'Southern white-crowned shrike',
	'Blue-tongued lizard',
	'Andean goose',
	'Javanese cormorant',
	'American racer',
	'Gray heron',
	'Pie, indian tree',
	'Three-banded plover',
	'Japanese macaque',
	'Gulls (unidentified)',
	'Cattle egret',
	'Tasmanian devil',
	'Monkey, red howler',
	'Glider, squirrel',
	'Rhesus macaque',
	'African wild cat',
	'Cheetah',
	'Galah',
	'Southern elephant seal',
	'Little heron',
	'Duck, mountain',
	'Bushbuck',
	'Weaver, red-billed buffalo',
	'Spotted wood sandpiper',
	'Dark-winged trumpeter',
	'Buffalo, wild water',
	'Small Indian mongoose',
	'Tern, white-winged black',
	'European stork',
	'Aardwolf',
	'Trumpeter swan',
	'Heron, gray',
	'Red-headed woodpecker',
	'Black-footed ferret',
	'Dragon, asian water',
	'Lemur, ring-tailed',
	'Crane, stanley',
	'Praying mantis (unidentified)',
	'Goose, canada',
	'Carmine bee-eater',
	'Bohor reedbuck',
	'Eagle, white-bellied sea',
	'Fox, silver-backed',
	'Great skua',
	'Red-knobbed coot',
	'Heron, giant',
	'Impala',
	'Brazilian tapir',
	'Nelson ground squirrel',
	'Parakeet, rose-ringed',
	'Toucan, red-billed',
	'Turtle, eastern box',
	'Cape clawless otter',
	'Legaan, ground',
	'Gecko, bent-toed',
	'Steller sea lion',
	'Silver gull',
	'Brazilian otter',
	'Red phalarope',
	'Comb duck',
	'American bighorn sheep',
	'Four-horned antelope',
	'Lemur, grey mouse',
	'Dog, black-tailed prairie',
	'Yellow-rumped siskin',
	'Deer, swamp',
	'Vulture, white-headed',
	'Frogmouth, tawny',
	'Grey lourie',
	"Boa, cook's tree",
	'Barking gecko',
	'Duiker, gray',
	'Fox, cape',
	'Catfish, blue',
	'Caiman, spectacled',
	'Fox, pampa gray',
	'Pelican, eastern white',
	'Goldeneye, common',
	"Dik, kirk's dik",
	'Squirrel, grey-footed',
	'Skua, great',
	'Blackish oystercatcher',
	'Raccoon dog',
	'Robin, kalahari scrub',
	'Dragon, komodo',
	'Springbok',
	'Siskin, pine',
	'Goat, mountain',
	'Wagtail, african pied',
	'Yellow-billed stork',
	'Brown pelican',
	'Goose, spur-winged',
	'Tortoise, indian star',
	'Lemur, lesser mouse',
	'Warthog',
	'Banded mongoose',
	'Cormorant (unidentified)',
	'Boa, emerald green tree',
	'Water monitor',
	'Boubou, southern',
	'Feral rock pigeon',
	'Rattlesnake, dusky',
	'Southern screamer',
	'Helmeted guinea fowl',
	'Wild water buffalo',
	'Dragon, netted rock',
	'Robin, white-throated',
	'Caribou',
	'Starling, greater blue-eared',
	'Red-billed toucan',
	'Superb starling',
	'White-browed sparrow weaver',
	'Vervet monkey',
	'Asian red fox',
	'Jackal, golden',
	'Roadrunner, greater',
	'Western grey kangaroo',
	"Levaillant's barbet",
	'Gull, lava',
	'Coot, red-knobbed',
	'Chuckwalla',
	'Southern brown bandicoot',
	'Asian elephant',
	'Ringtail, common',
	'Waved albatross',
	'Anteater, giant',
	'Wallaby, agile',
	"Squirrel, richardson's ground",
	'Gull, silver',
	'Barrows goldeneye',
	'Lorikeet, scaly-breasted',
	'Mouse, four-striped grass',
	'Savannah deer (unidentified)',
	"Grant's gazelle",
	'Sable antelope',
	'Cereopsis goose',
	'Quoll, eastern',
	'Bee-eater, nubian',
	'Black-eyed bulbul',
	'Alpaca',
	'Otter, brazilian',
	'Australian magpie',
	'Roseate cockatoo',
	'Cat, tiger',
	'Zorilla',
	'Two-toed tree sloth',
	'Neotropic cormorant',
	'Pied crow',
	'Eagle, bald',
	'Monkey, black spider',
	'Red squirrel',
	'Hoary marmot',
	'Cat, native',
	'Ferruginous hawk',
	'Klipspringer',
	'White-eye, pale',
	'Red sheep',
	'Madagascar fruit bat',
	'Spotted-tailed quoll',
	'Red deer',
	'Puna ibis',
	'Caracara (unidentified)',
	'Grey mouse lemur',
	'White-throated robin',
	'Steenbok',
	'Mexican boa',
	'Secretary bird',
	'Bear, black',
	'Malabar squirrel',
	'Least chipmunk',
	'Australian pelican',
	'Dog, raccoon',
	'Agama lizard (unidentified)',
	'Bleu, red-cheeked cordon',
	"Richardson's ground squirrel",
	'Peccary, collared',
	'Iguana, land',
	'Indian porcupine',
	'Eastern fox squirrel',
	'Eurasian red squirrel',
	'Puma, south american',
	'Antelope ground squirrel',
	'Common wombat',
	'Hippopotamus',
	'Striped dolphin',
	'Common ringtail',
	'Monster, gila',
	'Buffalo, african',
	'Magpie, australian',
	'Grouse, greater sage',
	'Kudu, greater',
	'Heron, grey',
	'Scaly-breasted lorikeet',
	'Macaque, pig-tailed',
	'Masked booby',
	'Pie, rufous tree',
	'African polecat',
	'Malachite kingfisher',
	'Macaw, blue and gold',
	'White-tailed deer',
	'Buffalo, american',
	'Hedgehog, south african',
	'Sacred ibis',
	'Screamer, southern',
	'Cat, long-tailed spotted',
	'South African hedgehog',
	'Southern hairy-nosed wombat',
	'Tarantula, salmon pink bird eater',
	'African elephant',
	'Rose-ringed parakeet',
	"Cook's tree boa",
	'Eurasian badger',
	'Gull, pacific',
	'Laughing dove',
	'Turkey, wild',
	'Collared peccary',
	'White rhinoceros',
	'Bear, sloth',
	'Squirrel, antelope ground',
	'Legaan, water',
	'Red-cheeked cordon bleu',
	'Jaeger, long-tailed',
	'Dusky gull',
	'Sloth, two-toed',
	'Echidna, short-beaked',
	'Nyala',
	'Great white pelican',
	'Zebra, plains',
	'Armadillo, giant',
	'Hyena, spotted',
	'Langur, gray',
	'Desert tortoise',
	'Bunting, crested',
	'Hottentot teal',
	'Bobcat',
	'Egyptian vulture',
	'Southern lapwing',
	'Snake, tiger',
	'Carpet python',
	'Emerald-spotted wood dove',
	'Eleven-banded armadillo (unidentified)',
	'Duiker, common',
	"Hornbill, leadbeateri's ground",
	'Snake-necked turtle',
	'Deer, barasingha',
	'Ground monitor (unidentified)',
	'Bat, madagascar fruit',
	'Desert kangaroo rat',
	'Violet-eared waxbill',
	'Wolf spider',
	'Yellow-headed caracara',
	'Little blue penguin',
	'Red-billed hornbill',
	'Avocet, pied',
	'Yellow-brown sungazer',
	'Squirrel, palm',
	'Sloth, pale-throated three-toed',
	'Cockatoo, red-tailed',
	'Dolphin, striped',
	'Darter, african',
	'Killer whale',
	'Oriental short-clawed otter',
	"Swainson's francolin",
	'Swallow-tail gull',
	'North American river otter',
	'Lemur, sportive',
	'Kangaroo, black-faced',
	'Fox, blue',
	'Small-clawed otter',
	'Seal, common',
	'Bustard, stanley',
	'Dog, bush',
	'Loris, slender',
	'Giraffe',
	'Gnu, brindled',
	'Starling, superb',
	'Crab, red lava',
	'Gaur',
	'Racer, american',
	'Mexican wolf',
	'Plains zebra',
	'Spur-winged goose',
	'Kangaroo, red',
	'Bandicoot, short-nosed',
	'Swan, black',
	'Lion, southern sea',
	'Malleefowl',
	'Eastern dwarf mongoose',
	'Hyrax',
	'Black curlew',
	'Vicuna',
	'Brush-tailed phascogale',
	'Tailless tenrec',
	'Rhea, gray',
	'Dragon, frilled',
	'Snake, carpet',
	'Heron, green',
	'Monitor, water',
	'Trumpeter, green-winged',
	'Bleeding heart monkey',
	'Northern phalarope',
	'Coqui partridge',
	'Antechinus, brown',
	'African clawless otter',
	'North American beaver',
	'Mountain duck',
	'Flamingo, chilean',
	'Golden brush-tailed possum',
	'Sockeye salmon',
	'Dunnart, fat-tailed',
	'Golden jackal',
	'American woodcock',
	'Kafue flats lechwe',
	'Horned lark',
	'Red meerkat',
	'Godwit, hudsonian',
	'Savanna baboon',
	'Chameleon (unidentified)',
	'African buffalo',
	'Vulture, griffon',
	'Northern fur seal',
	'Tree porcupine',
	'Egyptian viper',
	'Blue and yellow macaw',
	'Peregrine falcon',
	'Owl, madagascar hawk',
	'Frilled lizard',
	'Common genet',
];
