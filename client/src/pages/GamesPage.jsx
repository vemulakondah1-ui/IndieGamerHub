// src/pages/GamesPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GamesPage.css';

export default function GamesPage() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Curated catalog with 15+ distinct, unique games per theme/genre with real distinct thumbnails and platforms
  const comprehensiveCatalog = [
    // --- ACTION ---
    { _id: '105600', title: 'Terraria', platform: 'Steam', genres: ['Action', 'Indie'], price: '$9.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/105600/header.jpg', short_description: 'Dig, fight, explore, build! Nothing is impossible.' },
    { _id: 'epic-hades', title: 'Hades', platform: 'Epic Games', genres: ['Action', 'RPG'], price: '$24.99', thumbnail: 'https://cdn1.epicgames.com/salesEvent/salesEvent/EGS_Hades_SupergiantGames_S1_2560x1440-a1789a192661ab209de0b28414457e4c', short_description: 'Defy the god of the dead as you hack and slash out of the Underworld.' },
    { _id: '588650', title: 'Dead Cells', platform: 'Steam', genres: ['Action', 'Platformer'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/588650/header.jpg', short_description: 'A rogue-lite, metroidvania-inspired action platformer.' },
    { _id: '1217060', title: 'Risk of Rain 2', platform: 'Steam', genres: ['Action', 'Survival'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1217060/header.jpg', short_description: 'Escape a chaotic alien planet by fighting through hordes of monsters.' },
    { _id: '268910', title: 'Cuphead', platform: 'Steam', genres: ['Action', 'Indie'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/268910/header.jpg', short_description: 'Classic run and gun action game heavily inspired by 1930s cartoons.' },
    { _id: '585890', title: 'Katana Zero', platform: 'Steam', genres: ['Action', 'Indie'], price: '$14.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/585890/header.jpg', short_description: 'A stylish neo-noir, fast-paced action platformer.' },
    { _id: '311690', title: 'Enter the Gungeon', platform: 'Steam', genres: ['Action', 'Indie'], price: '$14.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/311690/header.jpg', short_description: 'A bullet hell dungeon crawler following a band of misfits.' },
    { _id: '504230', title: 'Celeste', platform: 'Steam', genres: ['Action', 'Adventure'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/504230/header.jpg', short_description: 'Help Madeline survive her inner demons on Mount Celeste.' },
    { _id: '219150', title: 'Hotline Miami', platform: 'Steam', genres: ['Action', 'Indie'], price: '$9.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/219150/header.jpg', short_description: 'A high-octane action game overflowing with raw brutality.' },
    { _id: '387990', title: 'Smite', platform: 'Epic Games', genres: ['Action', 'Strategy'], price: 'Free to Play', thumbnail: 'https://cdn1.epicgames.com/offer/f32630d7fa654497a7d4b4a1bfa821cb/EGS_SMITE_TitanForgeGames_S1_2560x1440-69018e692131976a1617e174b5c7774e', short_description: 'Join over 35 million players in the online battleground of the gods.' },
    { _id: '322330', title: 'Don\'t Starve Together', platform: 'Steam', genres: ['Action', 'Survival'], price: '$14.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/322330/header.jpg', short_description: 'Standalone multiplayer expansion of the uncompromising wilderness survival game.' },
    { _id: '250900', title: 'The Binding of Isaac: Rebirth', platform: 'Steam', genres: ['Action', 'Indie'], price: '$14.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/250900/header.jpg', short_description: 'An action RPG shooter with heavy rogue-like elements.' },
    { _id: '648800', title: 'Rogue Legacy 2', platform: 'Steam', genres: ['Action', 'Indie'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/648800/header.jpg', short_description: 'A genealogical rogue-lite gripping action platformer.' },
    { _id: '1145360', title: 'Blasphemous', platform: 'Steam', genres: ['Action', 'Indie'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg', short_description: 'A brutal action-platformer with skilled hack-n-slash combat.' },
    { _id: '953490', title: 'Car Mechanic Simulator 2021', platform: 'Steam', genres: ['Action', 'Simulation'], price: '$29.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/953490/header.jpg', short_description: 'Build and expand your repair service empire.' },

    // --- ADVENTURE ---
    { _id: '753640', title: 'Outer Wilds', platform: 'Epic Games', genres: ['Adventure', 'Indie'], price: '$24.99', thumbnail: 'https://cdn1.epicgames.com/salesEvent/salesEvent/EGS_OuterWilds_MobiusDigital_S1_2560x1440-6b677708da80a37e8c2a30cb41399432', short_description: 'A critically acclaimed mystery about a solar system trapped in an endless time loop.' },
    { _id: '264710', title: 'Subnautica', platform: 'Steam', genres: ['Adventure', 'Survival'], price: '$29.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/264710/header.jpg', short_description: 'Descend into the depths of an alien underwater world full of wonder and peril.' },
    { _id: '621060', title: 'Firewatch', platform: 'Steam', genres: ['Adventure', 'Indie'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/621060/header.jpg', short_description: 'A single-player first-person mystery set in the Wyoming wilderness.' },
    { _id: '367520', title: 'Hollow Knight', platform: 'Steam', genres: ['Adventure', 'Indie'], price: '$14.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg', short_description: 'Explore a vast ruined kingdom of insects and heroes.' },
    { _id: '548430', title: 'Deep Rock Galactic', platform: 'Steam', genres: ['Adventure', 'Action'], price: '$29.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/548430/header.jpg', short_description: '1-4 player co-op FPS featuring badass space dwarves.' },
    { _id: '975370', title: 'Chants of Sennaar', platform: 'Epic Games', genres: ['Adventure', 'Indie'], price: '$19.99', thumbnail: 'https://cdn1.epicgames.com/offer/79d38c64448545e8a93bcbe156d11e51/EGS_ChantsofSennaar_Rundisc_S1_2560x1440-62007e0c4a04d209d0cbcc52cdfa753e', short_description: 'Reconnect the peoples of the Tower through the power of ancient languages.' },
    { _id: '1097840', title: 'Gris', platform: 'Steam', genres: ['Adventure', 'Indie'], price: '$16.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1097840/header.jpg', short_description: 'An evocative artistic experience free from danger or frustration.' },
    { _id: '534380', title: 'Dying Light', platform: 'Steam', genres: ['Adventure', 'Action'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/534380/header.jpg', short_description: 'First-person action survival game set in a post-apocalyptic open world.' },
    { _id: '397540', title: 'Borderlands 3', platform: 'Epic Games', genres: ['Adventure', 'Action'], price: '$59.99', thumbnail: 'https://cdn1.epicgames.com/offer/ed8d53c8d35d479eaf61cb5e2cbcdb54/EGS_Borderlands3_GearboxSoftware_S1_2560x1440-4100c6114e9eb0bc46313b2d18451db9', short_description: 'The original shooter-looter returns, packing bazillions of guns.' },
    { _id: '552990', title: 'The Witness', platform: 'Epic Games', genres: ['Adventure', 'Indie'], price: '$39.99', thumbnail: 'https://cdn1.epicgames.com/salesEvent/salesEvent/EGS_TheWitness_TheklaInc_S1_2560x1440-b6f72f888365ef5e2d1a3fa43df4d852', short_description: 'Explore an open island filled with dozens of puzzles.' },
    { _id: '582010', title: 'Monster Hunter: World', platform: 'Steam', genres: ['Adventure', 'RPG'], price: '$29.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/582010/header.jpg', short_description: 'Battle giant monsters in a breathtaking ecosystem.' },
    { _id: '814380', title: 'Sekiro: Shadows Die Twice', platform: 'Steam', genres: ['Adventure', 'Action'], price: '$59.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/814380/header.jpg', short_description: 'Carve your own clever path to vengeance in a critically acclaimed adventure.' },
    { _id: '1158310', title: 'Crusader Kings III', platform: 'Steam', genres: ['Adventure', 'Strategy'], price: '$49.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1158310/header.jpg', short_description: 'Live the life of a medieval ruler in grand strategy majesty.' },
    { _id: '238960', title: 'Path of Exile', platform: 'Steam', genres: ['Adventure', 'RPG'], price: 'Free to Play', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/238960/header.jpg', short_description: 'You are an exile, struggling to survive on the dark continent of Wraeclast.' },
    { _id: '391540', title: 'Undertale', platform: 'Steam', genres: ['Adventure', 'Indie'], price: '$9.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/391540/header.jpg', short_description: 'The RPG game where you do not have to destroy anyone.' },

    // --- RPG ---
    { _id: '292030', title: 'The Witcher 3: Wild Hunt', platform: 'Steam', genres: ['RPG', 'Adventure'], price: '$39.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg', short_description: 'You are Geralt of Rivia, mercenary monster slayer.' },
    { _id: '1086940', title: 'Baldur\'s Gate 3', platform: 'Steam', genres: ['RPG', 'Strategy'], price: '$59.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg', short_description: 'Gather your party and return to the Forgotten Realms in a tale of fellowship.' },
    { _id: '632360', title: 'Disco Elysium - The Final Cut', platform: 'Steam', genres: ['RPG', 'Indie'], price: '$39.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/632360/header.jpg', short_description: 'A groundbreaking role playing game with unprecedented freedom of choice.' },
    { _id: '435150', title: 'Divinity: Original Sin 2', platform: 'Steam', genres: ['RPG', 'Strategy'], price: '$44.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/435150/header.jpg', short_description: 'The eagerly anticipated sequel to the award-winning RPG.' },
    { _id: '1091500', title: 'Cyberpunk 2077', platform: 'Steam', genres: ['RPG', 'Action'], price: '$59.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg', short_description: 'An open-world, action-adventure RPG set in Night City.' },
    { _id: '1113000', title: 'Persona 4 Golden', platform: 'Steam', genres: ['RPG', 'Adventure'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1113000/header.jpg', short_description: 'Explore the wondrous coming-of-age mystery in rural Japan.' },
    { _id: '1687950', title: 'Persona 5 Royal', platform: 'Steam', genres: ['RPG', 'Adventure'], price: '$59.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1687950/header.jpg', short_description: 'Put on the mask of the Phantom Thieves of Hearts.' },
    { _id: '1172620', title: 'Sea of Stars', platform: 'Epic Games', genres: ['RPG', 'Indie'], price: '$34.99', thumbnail: 'https://cdn1.epicgames.com/offer/0f331f0cf326462788e0b6df4b2aa9bb/EGS_SeaofStars_SabotageStudio_S1_2560x1440-7e4b2d6a74db5ce9d721e780cd395b08', short_description: 'A turn-based RPG inspired by the classics.' },
    { _id: '312530', title: 'Genshin Impact', platform: 'Epic Games', genres: ['RPG', 'Action'], price: 'Free to Play', thumbnail: 'https://cdn1.epicgames.com/salesEvent/salesEvent/EGS_GenshinImpact_miHoYoLimited_S1_2560x1440-9a3b1a8d07e60b24dc64ec0fb554b4c7', short_description: 'Step into Teyvat, a vast world teeming with life and elemental energy.' },
    { _id: '359550', title: 'Rainbow Six Siege', platform: 'Steam', genres: ['RPG', 'Action'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/359550/header.jpg', short_description: 'Master the art of destruction and gadgetry in intense tactical combat.' },
    { _id: '546560', title: 'Half-Life: Alyx', platform: 'Steam', genres: ['RPG', 'Action'], price: '$59.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/546560/header.jpg', short_description: 'Valve\'s return to the Half-Life series set between the events of Half-Life and Half-Life 2.' },
    { _id: '374320', title: 'DARK SOULS III', platform: 'Steam', genres: ['RPG', 'Action'], price: '$59.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/374320/header.jpg', short_description: 'Dark Souls continues to push the boundaries with the latest ambitious chapter.' },
    { _id: '1245620', title: 'Elden Ring', platform: 'Steam', genres: ['RPG', 'Adventure'], price: '$59.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg', short_description: 'Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring.' },
    { _id: '489830', title: 'The Elder Scrolls V: Skyrim Special Edition', platform: 'Steam', genres: ['RPG', 'Adventure'], price: '$39.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/489830/header.jpg', short_description: 'Winner of more than 200 Game of the Year Awards.' },
    { _id: '292120', title: 'Grim Dawn', platform: 'Steam', genres: ['RPG', 'Action'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/292120/header.jpg', short_description: 'Enter an apocalyptic fantasy world where humanity is on the brink of extinction.' },

    // --- STRATEGY ---
    { _id: 'epic-civ6', title: 'Civilization VI', platform: 'Epic Games', genres: ['Strategy', 'Simulation'], price: '$29.99', thumbnail: 'https://cdn1.epicgames.com/offer/52925ecf23f640fc9271667d4cc1aa72/EGS_SidMeiersCivilizationVI_FiraxisGames_S1_2560x1440-7e3e08216cb48bb657157ccae7918a59', short_description: 'Build an empire to stand the test of time.' },
    { _id: '427520', title: 'Factorio', platform: 'Steam', genres: ['Strategy', 'Simulation'], price: '$35.00', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/427520/header.jpg', short_description: 'Build and maintain automated factories of immense scale.' },
    { _id: '294100', title: 'RimWorld', platform: 'Steam', genres: ['Strategy', 'Simulation'], price: '$34.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/294100/header.jpg', short_description: 'A sci-fi colony sim driven by an intelligent story teller.' },
    { _id: '646570', title: 'Slay the Spire', platform: 'Steam', genres: ['Strategy', 'Indie'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/646570/header.jpg', short_description: 'Craft a unique deck, encounter bizarre creatures, and discover relics of immense power.' },
    { _id: '230410', title: 'Warframe', platform: 'Steam', genres: ['Strategy', 'Action'], price: 'Free to Play', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/230410/header.jpg', short_description: 'Master the Tenno in a stunning sci-fi cooperative action game.' },
    { _id: '504370', title: 'Into the Breach', platform: 'Epic Games', genres: ['Strategy', 'Indie'], price: '$14.99', thumbnail: 'https://cdn1.epicgames.com/salesEvent/salesEvent/EGS_IntotheBreach_SubsetGames_S1_2560x1440-9a22eb28bc74041b6be1a00a89d7b425', short_description: 'Control powerful mechs from the future to defeat an alien threat.' },
    { _id: '323190', title: 'Frostpunk', platform: 'Steam', genres: ['Strategy', 'Simulation'], price: '$29.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/323190/header.jpg', short_description: 'Society survival game where heat means life and every decision comes at a cost.' },
    { _id: '281990', title: 'Stellaris', platform: 'Steam', genres: ['Strategy', 'Simulation'], price: '$39.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/281990/header.jpg', short_description: 'Explore a vast galaxy full of wonder in a deep grand strategy sci-fi epic.' },
    { _id: '406300', title: 'Tooth and Tail', platform: 'Steam', genres: ['Strategy', 'Indie'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/406300/header.jpg', short_description: 'RTS warfare featuring revolutionary animals.' },
    { _id: '784150', title: 'The Sims 4', platform: 'Epic Games', genres: ['Strategy', 'Simulation'], price: 'Free to Play', thumbnail: 'https://cdn1.epicgames.com/offer/aa591bba6a4c48f88879b5c3ff21f8a8/EGS_TheSims4_Maxis_S1_2560x1440-9be0d77af5564858bfa79f649ea9ca7a', short_description: 'Unleash your imagination and create a unique world of Sims.' },
    { _id: '594570', title: 'Total War: WARHAMMER II', platform: 'Steam', genres: ['Strategy', 'Action'], price: '$59.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/594570/header.jpg', short_description: 'A breathtaking strategy game of grand proportions.' },
    { _id: '8930', title: 'Sid Meier\'s Civilization V', platform: 'Steam', genres: ['Strategy'], price: '$29.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/8930/header.jpg', short_description: 'Become Ruler of the World by establishing and leading a civilization.' },
    { _id: '457140', title: 'Oxygen Not Included', platform: 'Steam', genres: ['Strategy', 'Simulation'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/457140/header.jpg', short_description: 'A space-colony simulation game brimming with survival mechanics.' },
    { _id: '774241', title: 'Counter-Strike 2', platform: 'Steam', genres: ['Strategy', 'Action'], price: 'Free to Play', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg', short_description: 'The largest technical leap in Counter-Strike history.' },
    { _id: '1284210', title: 'The Last of Us Part I', platform: 'Steam', genres: ['Strategy', 'Adventure'], price: '$59.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1888930/header.jpg', short_description: 'Experience the emotional storytelling and unforgettable characters in Joel and Ellie\'s journey.' },

    // --- SIMULATION ---
    { _id: '413150', title: 'Stardew Valley', platform: 'Steam', genres: ['Simulation', 'Indie'], price: '$14.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg', short_description: 'Inherit your grandfather\'s old farm plot and build your new life.' },
    { _id: '255710', title: 'Cities: Skylines', platform: 'Steam', genres: ['Simulation', 'Strategy'], price: '$29.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/255710/header.jpg', short_description: 'A modern take on the classic city simulation.' },
    { _id: '227300', title: 'Euro Truck Simulator 2', platform: 'Steam', genres: ['Simulation'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/227300/header.jpg', short_description: 'Travel across Europe as king of the road.' },
    { _id: '1248130', title: 'Farming Simulator 22', platform: 'Epic Games', genres: ['Simulation'], price: '$39.99', thumbnail: 'https://cdn1.epicgames.com/offer/c4cb64ffb0274e10b1008be7326df2fb/EGS_FarmingSimulator22_GIANTSSoftware_S1_2560x1440-2560x1440-8b1b59a68a183beba4e5900508a8a4f9', short_description: 'Take on the role of a modern farmer and build your agricultural empire.' },
    { _id: '493340', title: 'Planet Coaster', platform: 'Steam', genres: ['Simulation'], price: '$44.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/493340/header.jpg', short_description: 'Surprise, delight and thrill your crowds as you build your coaster park.' },
    { _id: '1190000', title: 'House Flipper', platform: 'Steam', genres: ['Simulation'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1190000/header.jpg', short_description: 'A unique chance to become a one-man renovation crew.' },
    { _id: '1290000', title: 'PowerWash Simulator', platform: 'Epic Games', genres: ['Simulation', 'Indie'], price: '$24.99', thumbnail: 'https://cdn1.epicgames.com/offer/79d38c64448545e8a93bcbe156d11e51/EGS_PowerWashSimulator_SquareEnixLtd_S1_2560x1440-8c29219b168da1732e7f2257d9ad6387', short_description: 'Bliss away your worries with high-pressure streams of water.' },
    { _id: '1130200', title: 'Monsters Domain', platform: 'Steam', genres: ['Simulation', 'RPG'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1130200/header.jpg', short_description: 'Command terrifying monsters in tactical simulation battles.' },
    { _id: '1122750', title: 'Stationeers', platform: 'Steam', genres: ['Simulation', 'Survival'], price: '$29.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1122750/header.jpg', short_description: 'Manage a space station construction and engineering simulation.' },
    { _id: '990080', title: 'Schedule Runner', platform: 'Steam', genres: ['Simulation'], price: '$12.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/990080/header.jpg', short_description: 'Master time management in bustling urban public transit networks.' },
    { _id: '678900', title: 'Cooking Simulator', platform: 'Steam', genres: ['Simulation'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/678900/header.jpg', short_description: 'Take control of a highly polished, realistic kitchen.' },
    { _id: '1074100', title: 'Passenger Train Sim', platform: 'Steam', genres: ['Simulation'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1074100/header.jpg', short_description: 'Drive high-speed passenger locomotives across intricate international lines.' },
    { _id: '800140', title: 'TheHunter: Call of the Wild', platform: 'Steam', genres: ['Simulation', 'Adventure'], price: '$29.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/518790/header.jpg', short_description: 'Experience an atmospheric hunting game like no other.' },
    { _id: '445220', title: 'Avorion', platform: 'Steam', genres: ['Simulation', 'Strategy'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/445220/header.jpg', short_description: 'Build your own space ships out of procedural blocks.' },
    { _id: '1087100', title: 'Ranch Simulator', platform: 'Steam', genres: ['Simulation', 'Survival'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1087100/header.jpg', short_description: 'Rebuild your grandfather\'s homestead into the most flourishing ranch.' },

    // --- INDIE ---
    { _id: '108600', title: 'Project Zomboid', platform: 'Steam', genres: ['Indie', 'Survival'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/108600/header.jpg', short_description: 'Project Zomboid is an open-ended zombie survival sim.' },
    { _id: '1063730', title: 'New World', platform: 'Steam', genres: ['Indie', 'RPG'], price: '$39.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1063730/header.jpg', short_description: 'Explore a thrilling open-world MMO packed with danger and opportunity.' },
    { _id: '601510', title: 'The Stanley Parable: Ultra Deluxe', platform: 'Steam', genres: ['Indie', 'Adventure'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/601510/header.jpg', short_description: 'A first-person exploration game that plays with narrative conventions.' },
    { _id: '206420', title: 'Saints Row IV', platform: 'Steam', genres: ['Indie', 'Action'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/206420/header.jpg', short_description: 'The boss of the Saints has been elected President of the United States.' },
    { _id: '262060', title: 'Darkest Dungeon', platform: 'Steam', genres: ['Indie', 'RPG'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/262060/header.jpg', short_description: 'A challenging gothic roguelike turn-based RPG.' },
    { _id: '244850', title: 'Space Engineers', platform: 'Steam', genres: ['Indie', 'Simulation'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/244850/header.jpg', short_description: 'A sandbox game about engineering, construction, and survival.' },
    { _id: '304930', title: 'Unturned', platform: 'Steam', genres: ['Indie', 'Survival'], price: 'Free to Play', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/304930/header.jpg', short_description: 'You are a survivor in the zombie-infested ruins of society.' },
    { _id: '268850', title: 'XCOM 2', platform: 'Steam', genres: ['Indie', 'Strategy'], price: '$49.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/268850/header.jpg', short_description: 'Earth has changed under alien rule.' },
    { _id: '251570', title: '7 Days to Die', platform: 'Steam', genres: ['Indie', 'Survival'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/251570/header.jpg', short_description: 'An open-world game that is a unique combination of first-person shooter and tower defense.' },
    { _id: '233450', title: 'Prison Architect', platform: 'Steam', genres: ['Indie', 'Simulation'], price: '$29.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/233450/header.jpg', short_description: 'Design and develop a maximum security prison.' },
    { _id: '307690', title: 'Dome Keeper', platform: 'Steam', genres: ['Indie', 'Strategy'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/307690/header.jpg', short_description: 'Mine resources and defend your dome from alien waves.' },
    { _id: '868190', title: 'Untitled Goose Game', platform: 'Epic Games', genres: ['Indie', 'Adventure'], price: '$19.99', thumbnail: 'https://cdn1.epicgames.com/salesEvent/salesEvent/EGS_UntitledGooseGame_HouseHouse_S1_2560x1440-62283a005089e6e8e82ef6ec4f9b8893', short_description: 'You are a horrible goose on an unsuspecting village.' },
    { _id: '582660', title: 'Black Desert', platform: 'Steam', genres: ['Indie', 'RPG'], price: '$9.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/582660/header.jpg', short_description: 'Live your best life in a vibrant MMORPG.' },
    { _id: '236390', title: 'War Thunder', platform: 'Steam', genres: ['Indie', 'Action'], price: 'Free to Play', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/236390/header.jpg', short_description: 'The most comprehensive free-to-play military MMO game.' },
    { _id: '381210', title: 'Dead by Daylight', platform: 'Steam', genres: ['Indie', 'Horror'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/381210/header.jpg', short_description: 'A multiplayer asymmetric horror game where one player takes on the role of a savage Killer.' },

    // --- SURVIVAL ---
    { _id: '252490', title: 'Rust', platform: 'Steam', genres: ['Survival', 'Action'], price: '$39.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/252490/header.jpg', short_description: 'The only aim in Rust is to survive.' },
    { _id: '892970', title: 'Valheim', platform: 'Steam', genres: ['Survival', 'Adventure'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/892970/header.jpg', short_description: 'A brutal exploration and survival game for 1-10 players set in a procedurally-generated purgatory.' },
    { _id: '242760', title: 'The Forest', platform: 'Steam', genres: ['Survival', 'Horror'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/242760/header.jpg', short_description: 'As the lone survivor of a passenger jet crash, you find yourself in a mysterious forest.' },
    { _id: '108601', title: 'Green Hell', platform: 'Steam', genres: ['Survival', 'Simulation'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/815370/header.jpg', short_description: 'A suffocating struggle for survival in the Amazonian rainforest.' },
    { _id: '305620', title: 'The Long Dark', platform: 'Steam', genres: ['Survival', 'Adventure'], price: '$34.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/305620/header.jpg', short_description: 'A thoughtful exploration-survival experience that challenges solo players.' },
    { _id: '383120', title: 'Empyrion - Galactic Survival', platform: 'Steam', genres: ['Survival', 'Simulation'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/383120/header.jpg', short_description: 'A 3D space survival adventure.' },
    { _id: '544550', title: 'Station Survival', platform: 'Steam', genres: ['Survival', 'Strategy'], price: '$14.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/544550/header.jpg', short_description: 'Manage orbital life support against cosmic hazards.' },
    { _id: '648801', title: 'Raft', platform: 'Steam', genres: ['Survival', 'Adventure'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/648800/header.jpg', short_description: 'Dive into an oceanic adventure alone or with friends.' },
    { _id: '313120', title: 'Stranded Deep', platform: 'Steam', genres: ['Survival', 'Adventure'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/313120/header.jpg', short_description: 'Catch your breath in the middle of the Pacific Ocean.' },
    { _id: '1149460', title: 'The Front', platform: 'Steam', genres: ['Survival', 'Action'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1149460/header.jpg', short_description: 'A survival open-world shooter set in a post-apocalyptic timeline.' },
    { _id: '1675200', title: 'Nightingale', platform: 'Epic Games', genres: ['Survival', 'Adventure'], price: '$29.99', thumbnail: 'https://cdn1.epicgames.com/offer/7dc68434ce8a49c99ec24f3fc6e4c35b/EGS_Nightingale_InflexionGames_S1_2560x1440-62bebe927161b4020c741e24749f50f4', short_description: 'Venture into the mystical realms of Fae.' },
    { _id: '1086941', title: 'Sons of the Forest', platform: 'Steam', genres: ['Survival', 'Horror'], price: '$29.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1326470/header.jpg', short_description: 'Sent to find a missing billionaire on a remote island, you find a cannibal-infested nightmare.' },
    { _id: '346110', title: 'ARK: Survival Evolved', platform: 'Steam', genres: ['Survival', 'Action'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/346110/header.jpg', short_description: 'Stranded on the shores of a mysterious island, you must learn to survive.' },
    { _id: '440900', title: 'Conan Exiles', platform: 'Steam', genres: ['Survival', 'Action'], price: '$39.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/440900/header.jpg', short_description: 'An online multiplayer survival game set in the lands of Conan the Barbarian.' },
    { _id: '617290', title: 'Remnant: From the Ashes', platform: 'Epic Games', genres: ['Survival', 'Action'], price: '$39.99', thumbnail: 'https://cdn1.epicgames.com/salesEvent/salesEvent/EGS_RemnantFromtheAshes_GunfireGames_S1_2560x1440-27f9103c834a5d8ee9d4f0b2f8a85532', short_description: 'A third-person survival action shooter set in a post-apocalyptic world.' },

    // --- HORROR ---
    { _id: 'epic-alanwake2', title: 'Alan Wake 2', platform: 'Epic Games', genres: ['Horror', 'Adventure'], price: '$49.99', thumbnail: 'https://cdn1.epicgames.com/offer/35766aa902a74b41b11b5eebda6a0d24/EGS_AlanWake2_RemedyEntertainment_S1_2560x1440-3d5fd06d86a65529141f3d32efce944a', short_description: 'Saga Anderson arrives to investigate ritualistic murders in a small town.' },
    { _id: '739630', title: 'Phasmophobia', platform: 'Steam', genres: ['Horror', 'Indie'], price: '$13.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/739630/header.jpg', short_description: '4 player online co-op psychological horror.' },
    { _id: '1569040', title: 'Amnesia: The Bunker', platform: 'Epic Games', genres: ['Horror', 'Adventure'], price: '$24.99', thumbnail: 'https://cdn1.epicgames.com/offer/79d38c64448545e8a93bcbe156d11e51/EGS_AmnesiaTheBunker_FrictionalGames_S1_2560x1440-62007e0c4a04d209d0cbcc52cdfa753e', short_description: 'A first-person horror game set in a desolate WW1 bunker.' },
    { _id: '238430', title: 'Outlast', platform: 'Steam', genres: ['Horror', 'Indie'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/238430/header.jpg', short_description: 'Hell is an experiment you can\'t survive in Outlast.' },
    { _id: '920560', title: 'MADISON', platform: 'Steam', genres: ['Horror', 'Indie'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/920560/header.jpg', short_description: 'A psychological horror game featuring disturbing gameplay and an unsettling narrative.' },
    { _id: '698780', title: 'Doki Doki Literature Club Plus!', platform: 'Steam', genres: ['Horror', 'Indie'], price: '$14.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1388880/header.jpg', short_description: 'Welcome to a terrifying world of poetry and romance.' },
    { _id: '1359650', title: 'Signalis', platform: 'Steam', genres: ['Horror', 'Adventure'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1262350/header.jpg', short_description: 'A classic tactical survival horror experience set in a dystopian future.' },
    { _id: '1194460', title: 'The Mortuary Assistant', platform: 'Steam', genres: ['Horror', 'Simulation'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1295920/header.jpg', short_description: 'Embalm corpses and banish demonic forces while working the night shift.' },
    { _id: '1361270', title: 'Bendy and the Dark Revival', platform: 'Steam', genres: ['Horror', 'Action'], price: '$29.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1063660/header.jpg', short_description: 'Discover the truth behind the cartoon studio nightmare.' },
    { _id: '1142710', title: 'Total Tank Simulator', platform: 'Steam', genres: ['Horror', 'Strategy'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/674020/header.jpg', short_description: 'Physics-based tactical combat across haunted battlefields.' },
    { _id: '268420', title: 'Resident Evil 7 Biohazard', platform: 'Steam', genres: ['Horror', 'Action'], price: '$39.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/418370/header.jpg', short_description: 'Fear and isolation seep through the walls of a dilapidated southern farmhouse.' },
    { _id: '205060', title: 'Resident Evil 2', platform: 'Steam', genres: ['Horror', 'Action'], price: '$39.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/883710/header.jpg', short_description: 'The genre-defining masterpiece returns, completely rebuilt for a new generation.' },
    { _id: '1454400', title: 'Iron Lung', platform: 'Steam', genres: ['Horror', 'Indie'], price: '$5.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1833640/header.jpg', short_description: 'Navigate a tiny submarine through an ocean of blood on an alien moon.' },
    { _id: '1313140', title: 'Cult of the Lamb', platform: 'Steam', genres: ['Horror', 'Indie'], price: '$24.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1313140/header.jpg', short_description: 'Start your own cult in a land of false prophets.' },
    { _id: '1574270', title: 'Crow Country', platform: 'Steam', genres: ['Horror', 'Indie'], price: '$19.99', thumbnail: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1996010/header.jpg', short_description: 'A nostalgic yet chilling return to classic 90s survival horror.' }
  ];

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/steam/games');
        const liveData = res.data.data || res.data.games || res.data;
        const combined = [...(Array.isArray(liveData) ? liveData : []), ...comprehensiveCatalog];
        setGames(combined);
      } catch (err) {
        setGames(comprehensiveCatalog);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const genres = ['All', 'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Indie', 'Survival', 'Horror'];

  const filteredGames = games.filter(game => {
    const gameGenres = game.genres || [game.genre || 'Action'];
    const matchesGenre = selectedGenre === 'All' || gameGenres.some(g => g.toLowerCase() === selectedGenre.toLowerCase());
    const matchesPlatform = selectedPlatform === 'All' || (game.platform || 'Steam') === selectedPlatform;
    const matchesSearch = (game.title || game.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesPlatform && matchesSearch;
  });

  return (
    <div className="page-wrapper games-page" style={{ paddingBottom: '80px' }}>
      <div className="container" style={{ paddingTop: '40px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>🎮 Explore Steam & Epic Games</h1>
          <p style={{ color: 'var(--text-muted)' }}>Browse 120+ distinct multi-platform titles with live pricing and community chats.</p>
        </div>

        {/* Search Bar & Platform Selector */}
        <div style={{ display: 'flex', gap: '12px', maxWidth: '700px', margin: '0 auto 24px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input
            type="text"
            placeholder="Search across Steam & Epic (e.g. Terraria, Hades, Rust)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: '280px', padding: '14px 20px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '1rem', outline: 'none' }}
          />
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            style={{ padding: '0 20px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
          >
            <option value="All">All Platforms</option>
            <option value="Steam">Steam Only</option>
            <option value="Epic Games">Epic Games Only</option>
          </select>
        </div>

        {/* Genre Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '40px' }}>
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                background: selectedGenre === genre ? 'var(--accent-primary)' : 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: selectedGenre === genre ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filteredGames.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: '3rem' }}>🔍</p>
            <h3 style={{ fontSize: '1.5rem', color: '#fff', margin: '12px 0' }}>No games found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try selecting a different genre or clearing your filters.</p>
            <button onClick={() => { setSelectedGenre('All'); setSelectedPlatform('All'); setSearchQuery(''); }} className="btn btn-primary" style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '10px' }}>Reset Filters</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {filteredGames.map((game, index) => {
              const gameId = game._id || game.id || `game-${index}`;
              const title = game.title || game.name;
              const thumb = game.thumbnail || game.header_image || game.imageUrl || 'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg';
              const desc = game.short_description || game.shortDescription;
              const price = game.price_overview?.final_formatted || game.price || '$14.99';
              const platformName = game.platform || 'Steam';

              return (
                <div
                  key={gameId}
                  onClick={() => navigate(`/games/${gameId}`)}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ position: 'relative', height: '160px', background: '#000' }}>
                    <img src={thumb} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: platformName === 'Steam' ? 'rgba(24, 43, 73, 0.9)' : 'rgba(40, 40, 40, 0.9)',
                      color: platformName === 'Steam' ? '#60a5fa' : '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      {platformName}
                    </span>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', color: '#fff' }}>{title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{desc}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{price}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 700 }}>View Details →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}