interface User {
  id: number;
  name: string;
  username: string;
  gender: 'female' | 'male';
  isPremium: boolean;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
}

// Female names
const femaleNames = [
  'Emma', 'Olivia', 'Ava', 'Sophia', 'Isabella',
  'Charlotte', 'Amelia', 'Mia', 'Harper', 'Evelyn',
  'Luna', 'Camila', 'Sofia', 'Aria', 'Scarlett'
];

// Male names
const maleNames = [
  'Liam', 'Noah', 'Oliver', 'Elijah', 'William',
  'James', 'Benjamin', 'Lucas', 'Henry', 'Alexander',
  'Thomas', 'Florian', 'Ethan', 'Daniel', 'Michael'
];

// Random username generator
const generateUsername = (name: string): string => {
  return `${name.toLowerCase()}${Math.floor(Math.random() * 1000)}`;
};

// Function to generate random position
const getRandomPosition = (): { x: number; y: number } => {
  // Get window dimensions (will be used for constraints)
  const maxX = window.innerWidth - 100;
  const maxY = window.innerHeight - 100;

  // Simple even distribution
  return {
    x: Math.random() * maxX,
    y: Math.random() * maxY,
  };
};

// Function to generate random speed
const getRandomSpeed = (): { speedX: number; speedY: number } => {
  // Much higher speed so cursors actually move visibly
  const speed = 1.5;
  const randomSpeed = () => (Math.random() > 0.5 ? 1 : -1) * (Math.random() * speed + 0.5);

  return {
    speedX: randomSpeed(),
    speedY: randomSpeed(),
  };
};

// Helper function to get a random item from array and remove it
const getRandomAndRemove = <T>(array: T[]): T => {
  const index = Math.floor(Math.random() * array.length);
  const item = array[index];
  array.splice(index, 1);
  return item;
};

// Main function to generate users
export const generateUsers = (): User[] => {
  const users: User[] = [];

  // Create copies of the arrays to work with
  const availableFemaleNames = [...femaleNames];
  const availableMaleNames = [...maleNames];

  // Generate 7 female users with unique names
  for (let i = 0; i < 7; i++) {
    // Get a random name and remove it from the available names
    const name = getRandomAndRemove(availableFemaleNames);
    const position = getRandomPosition();
    const speed = getRandomSpeed();

    users.push({
      id: i + 1,
      name,
      username: generateUsername(name),
      gender: 'female',
      isPremium: false,
      x: position.x,
      y: position.y,
      speedX: speed.speedX,
      speedY: speed.speedY,
    });
  }

  // Generate 3 male users (non-premium) with unique names
  for (let i = 0; i < 3; i++) {
    // Get a random name and remove it from the available names
    const name = getRandomAndRemove(availableMaleNames);
    const position = getRandomPosition();
    const speed = getRandomSpeed();

    users.push({
      id: i + 8,
      name,
      username: generateUsername(name),
      gender: 'male',
      isPremium: false,
      x: position.x,
      y: position.y,
      speedX: speed.speedX,
      speedY: speed.speedY,
    });
  }

  // Generate 1 premium male user with a unique name
  const premiumName = getRandomAndRemove(availableMaleNames);
  const premiumPosition = getRandomPosition();
  const premiumSpeed = getRandomSpeed();

  users.push({
    id: 11,
    name: premiumName,
    username: 'Digidop',
    gender: 'male',
    isPremium: true,
    x: premiumPosition.x,
    y: premiumPosition.y,
    speedX: premiumSpeed.speedX,
    speedY: premiumSpeed.speedY,
  });

  return users;
};
