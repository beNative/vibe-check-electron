/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {GoogleGenAI, Modality} from '@google/genai'
import {limitFunction} from 'p-limit'

const timeoutMs = 193_333
const maxRetries = 5
const baseDelay = 1_233

let aiPromise;
const getAi = () => {
  if (!aiPromise) {
    aiPromise = (async () => {
      // In Electron, `window.electron.getApiKey()` will be defined in preload.js.
      // In a regular browser, it'll be undefined and we'll fall back to process.env.API_KEY.
      const apiKey = await window.electron?.getApiKey() || process.env.API_KEY;
      if (!apiKey) {
        console.error("API key is missing.");
        throw new Error("API_KEY is not set.");
      }
      return new GoogleGenAI({apiKey});
    })();
  }
  return aiPromise;
};


export default limitFunction(
  async ({
    model,
    systemInstruction,
    prompt,
    promptImage,
    imageOutput,
    thinking,
    thinkingCapable
  }) => {
    const ai = await getAi();
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), timeoutMs)
        )

        const modelPromise = ai.models.generateContent({
          model,
          config: {
            systemInstruction,
            safetySettings,
            ...(thinkingCapable && !thinking
              ? {thinkingConfig: {thinkingBudget: 0}}
              : {}),
            ...(imageOutput
              ? {responseModalities: [Modality.TEXT, Modality.IMAGE]}
              : {})
          },

          contents: [
            {
              parts: [
                ...(promptImage
                  ? [
                      {
                        inlineData: {
                          data: promptImage.split(',')[1],
                          mimeType: 'image/png'
                        }
                      }
                    ]
                  : []),
                {text: prompt}
              ]
            }
          ]
        })

        return Promise.race([modelPromise, timeoutPromise]).then(res =>
          imageOutput
            ? 'data:image/png;base64,' +
              res.candidates[0].content.parts.find(p => p.inlineData).inlineData
                .data
            : res.text
        )
      } catch (error) {
        if (error.name === 'AbortError') {
          return
        }

        if (attempt === maxRetries - 1) {
          throw error
        }

        const delay = baseDelay * 2 ** attempt
        await new Promise(res => setTimeout(res, delay))
        console.warn(
          `Attempt ${attempt + 1} failed, retrying after ${delay}ms...`
        )
      }
    }
  },
  {concurrency: 9}
)

const safetySettings = [
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
  'HARM_CATEGORY_HARASSMENT'
].map(category => ({category, threshold: 'BLOCK_NONE'}))