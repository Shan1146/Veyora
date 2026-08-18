import { requireAuth } from '../utils/guards.js';
import { getUserProfile, updateUserProfile } from '../firebase/profile.js';
import { AVATARS } from '../avatar/avatar-list.js';

const user = await requireAuth();
let profile = await getUserProfile(user.uid);
let selected = profile.avatarPath || AVATARS[0].src;

const grid = document.querySelector('#avatar-grid');
const preview = document.querySelector('#avatar-preview');
const message = document.querySelector('#avatar-message');
const saveButton = document.querySelector('#save-avatar');

function render() {
  grid.innerHTML = AVATARS.map(avatar => `
    <button class="avatar-choice ${selected === avatar.src ? 'selected' : ''}" data-src="${avatar.src}" type="button">
      <img src="${avatar.src}" alt="${avatar.name} avatar">
      <span>${avatar.name}</span>
    </button>
  `).join('');

  grid.querySelectorAll('.avatar-choice').forEach(button => {
    button.addEventListener('click', () => {
      selected = button.dataset.src;
      preview.src = selected;
      message.textContent = '';
      render();
    });
  });

  preview.src = selected;
}

saveButton.addEventListener('click', async () => {
  saveButton.disabled = true;
  message.textContent = 'Saving...';
  try {
    await updateUserProfile(user.uid, { avatarPath: selected, avatarUrl: null, avatarConfig: null });
    profile = { ...profile, avatarPath: selected };
    message.textContent = 'Avatar saved ✓';
  } catch (error) {
    console.error(error);
    message.textContent = 'Save failed';
    alert(error?.message || 'Could not save avatar.');
  } finally {
    saveButton.disabled = false;
  }
});

render();
