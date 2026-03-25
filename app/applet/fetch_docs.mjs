import fs from 'fs';

const response = await fetch('https://sports.bzzoiro.com/docs');
const text = await response.text();

const lines = text.split('\n');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('logo') || line.toLowerCase().includes('img') || line.toLowerCase().includes('team')) {
    console.log(`Line ${i}: ${line.trim()}`);
  }
});
