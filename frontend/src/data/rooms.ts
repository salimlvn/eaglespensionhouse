import bedoneImage from '../assets/images/bedone.jpg';
import bedtwoImage from '../assets/images/bedtwo.jpg';
import crImage from '../assets/images/cr.jpg';
import grandArcadeImage from '../assets/images/grandarcade.jpg';
import hallwayImage from '../assets/images/hallway.jpg';
import hallwayTwoImage from '../assets/images/hallwaytwo.jpg';
import lobbyImage from '../assets/images/lobby.jpg';
import showerImage from '../assets/images/shower.jpg';
import sinkImage from '../assets/images/sink.jpg';

export const rooms = [
  { name: 'Single Bed Room', image: bedoneImage },
  { name: 'Twin Bed Room', image: bedtwoImage },
  { name: 'Common Comfort Room', image: crImage },
  { name: 'Grand Arcade Building', image: grandArcadeImage },
  { name: 'Hallway View', image: hallwayImage },
  { name: 'Upper Hallway', image: hallwayTwoImage },
  { name: 'Lobby Area', image: lobbyImage },
  { name: 'Shower Area', image: showerImage },
  { name: 'Shared Sink Area', image: sinkImage },
] as const;