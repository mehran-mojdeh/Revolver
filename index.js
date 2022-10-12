const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.height = 1024;
canvas.width = 576;

// Sprite Class
class Sprite {
  constructor({size, position, velocity, color}) {
    this.size = size || {x:50, y:50};
    this.position = position;
    this.velocity = velocity || {x:0, y:0};
    this.color = color || 'red';
  }
  draw() {
    c.fillStyle = this.color;
    c.fillRect(this.position.x, this.position.y, this.size.x, this.size.y)
  }
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}
// Character Class
class Character extends Sprite {
  constructor(props) {
    super(props);
    this.hitPoints = { max: props.hitPoints || 1, current: props.hitPoints || 1};
    this.isDead = false;
    this.range = props.range || 10;
  }
  aoe() {
    return {
      position: {
        x: this.position.x - this.range,
        y: this.position.y - this.range
      },
      size: {
        x: this.size.x + this.range * 2,
        y: this.size.y + this.range * 2
      }
    }
  }
  isInRange(ch) {
    return doesCollide(this.aoe(), ch);
  }
  takeHit(damage) {
    this.hitPoints.current -= damage;
    console.log(`${this.hitPoints.current} / ${this.hitPoints.max}`);
    if ( this.hitPoints.current <= 0 ) this.isDead = true;
  }
}
// Player Class
class Player extends Character {
  constructor(props) {
    super(props)
  }
  attack({type, damage, delay}) {
    if (controls.attack) return;
    controls.attack = type;
    switch (type) {
      case 'range':
        setTimeout(() => {
          let p = new Projectile({
            position: {
              x: player.position.x + player.size.x/2, //  player center - half of projectile's width
              y: player.position.y
            },
            damage
          });
          p.draw();
          projectiles.push(p);
          controls.attack = false
        }, delay);
        break;
      case 'mele':
        setTimeout(() => {
          for (i in enemies) {
            let e = enemies[i];
            if (this.isInRange(e)) e.takeHit(damage);
            if (e.isDead) {
              e.die();
              delete enemies[i];
            }
          }
          controls.attack = false
        }, delay);
        break;
      default:
        break;
    }
  }
  die() {
    console.log('Player is dead!');
  }
}
// Enemy Class
class Enemy extends Character {
  constructor(props) {
    super(props);
  }
  die() {
    console.log('Enemy died!');
  }

}
// Projectile Class
class Projectile extends Sprite {
  constructor(props) {
    props.size = { x:4, y:8 };
    props.position.x += props.size.x/-2;
    props.velocity = { x:0 , y: -10 };
    props.color = 'black';
    super(props);
    this.damage = props.damage;
  }
  hit(enemy) {
    enemy.takeHit(this.damage);
  }
}
// Collision detection
function doesCollide(a, b) {
  if (a.position.x + a.size.x >= b.position.x && 
    a.position.x <= b.position.x + b.size.x &&
    a.position.y + a.size.y >= b.position.y &&
    a.position.y <= b.position.y + b.size.y ) {
      return true;
  }
  return false;
}
  
let enemies = [];
let projectiles = [];
  
// Spawn player
const player = new Player({
  position: {
    x: 263,
    y: 950
  },
  velocity: {
    x:0,
    y:0
  }
})
player.draw();
// Player controls
const controls = {
  up: 0,
  down: 0,
  right: 0,
  left: 0,
  attack: false
}

// Spawn enemies
setInterval(() => {
  const density = 50

  const enemy = new Enemy({
    position: {
      x: Math.floor(Math.random() * ( canvas.width - 50 ) / density) * density + 12,
      y: 0
    },
    velocity: {
      x:0,
      y:1
    },
    color: 'blue',
    hitPoints: 2
  });
  enemy.draw();
  enemies.push(enemy)
}, 4000)

// Game cycle
function animate() {
  window.requestAnimationFrame(animate);
  // Clear canvas
  c.clearRect(0, 0, canvas.width, canvas.height);
  // Move player
  player.update();
  player.velocity.x = controls.right - controls.left;
  player.velocity.y = controls.down - controls.up;
  // Player stay in canvas
  if ( player.position.x + player.velocity.x < 0 || 
    player.position.x + player.velocity.x + player.size.x > canvas.width ) 
    player.velocity.x = 0;
  if ( player.position.y + player.velocity.y < 0 ||
    player.position.y + player.velocity.y + player.size.y > canvas.height ) 
      player.velocity.y = 0;
  // Player attacking state
  if (controls.attack) {
    player.color = 'red';
    if(controls.attack === 'mele') {
      let aoe = player.aoe();
      c.fillStyle = 'lightcoral';
      c.fillRect(aoe.position.x, aoe.position.y, aoe.size.x, aoe.size.y);
    }
  }
  else player.color = 'black'
  // Move enemies
  for (i in enemies) {
    let enemy = enemies[i];
    enemy.update();
    if (enemy.position.y + enemy.size.y <= 0) projectiles.shift();
  }
  // Move projectiles
  for ( i in projectiles) {
    let p = projectiles[i];
    p.update();
    for ( j in enemies ) {
      let e = enemies[j];
      if ( doesCollide(p, e) ) {
        p.hit(e);
        delete projectiles[i];
        if (e.isDead) {
          e.die();
          delete enemies[j];
        }
      }
    }
    if (p.position.y + p.size.y <= 0) projectiles.shift();
  }
  // Remove deleted sprites
  enemies = enemies.filter(e => e);
  projectiles = projectiles.filter(p => p);
}
animate();

window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowRight':
      controls.right = 3;
      break;
    case 'ArrowLeft':
      controls.left = 3;
      break;
    case 'ArrowUp':
      controls.up = 3;
      break;
    case 'ArrowDown':
      controls.down = 3;
      break;
    case 'a':
      player.attack({type: 'range', damage: 1, delay: 700 });
      break;
    case 's':
      player.attack({type: 'mele', damage: 5, delay: 100 });
      break;
    default:
      break;
  }
})

window.addEventListener('keyup', (e) => {
  switch (e.key) {
    case 'ArrowRight':
      controls.right = 0;
      break;
    case 'ArrowLeft':
      controls.left = 0;
      break;
    case 'ArrowUp':
      controls.up = 0;
      break;
    case 'ArrowDown':
      controls.down = 0;
      break;
    default:
      // console.log(e);
      break;
  }
})
