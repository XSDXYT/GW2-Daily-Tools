<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { useI18n } from '../i18n';
import { render } from '../lib/canvas-renderer';
import type { ShareModel } from '../lib/share';
const props = defineProps<{ model: ShareModel | null }>();
const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();
const dialog = ref<HTMLDialogElement>();
const objectUrl = ref('');
const status = ref('imageGenerating');
const canShare = ref(false);
const sharing = ref(false);
let file: File | null = null;
let ticket = 0;
function cleanup() {
  ticket++;
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
  objectUrl.value = ''; file = null; canShare.value = false;
}
watch(() => props.model, async model => {
  cleanup();
  if (!model) { dialog.value?.close(); return; }
  const currentTicket = ticket;
  status.value = 'imageGenerating';
  dialog.value?.showModal();
  try {
    await document.fonts.ready;
    if (currentTicket !== ticket) return;
    const canvas = render(model);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG encoding failed')), 'image/png'));
    if (currentTicket !== ticket) return;
    objectUrl.value = URL.createObjectURL(blob);
    file = typeof File === 'function' ? new File([blob], model.filename, { type: 'image/png' }) : null;
    try { canShare.value = Boolean(file && typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })); } catch { canShare.value = false; }
    status.value = 'imageReady';
  } catch { if (ticket === currentTicket) status.value = 'imageFailed'; }
}, { flush: 'post' });
async function share() {
  if (!file) return;
  sharing.value = true;
  const currentTicket = ticket;
  try { await navigator.share({ files: [file] }); if (ticket === currentTicket) status.value = 'shareDone'; }
  catch (error) { if (ticket === currentTicket) status.value = error instanceof Error && error.name === 'AbortError' ? 'shareCancelled' : 'shareFailed'; }
  finally { sharing.value = false; }
}
onUnmounted(cleanup);
</script>

<template>
  <dialog id="share-dialog" ref="dialog" class="share-dialog" aria-labelledby="share-dialog-title" @close="cleanup(); emit('close')">
    <div class="share-dialog-heading"><h2 id="share-dialog-title">{{ t('previewTitle') }}</h2><button class="language-toggle" type="button" @click="dialog?.close()">{{ t('closePreview') }}</button></div>
    <p class="image-status" role="status">{{ t(status) }}</p>
    <div v-if="objectUrl && model" class="image-preview-wrap"><img class="share-preview" :src="objectUrl" :alt="model.alt"></div>
    <div v-if="objectUrl && model" class="image-actions">
      <a class="secondary-button" :href="objectUrl" :download="model.filename">{{ t('saveImage') }}</a>
      <button v-if="canShare" class="secondary-button" type="button" :disabled="sharing" @click="share">{{ t('shareImage') }}</button>
    </div>
  </dialog>
</template>
