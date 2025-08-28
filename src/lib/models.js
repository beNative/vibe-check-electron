/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export default {
  flash: {
    name: 'Flash (thinking off)',
    version: '2.5',
    modelString: 'gemini-2.5-flash',
    shortName: 'Flash',
    thinkingCapable: true,
    thinking: false
  },
  flashThinking: {
    name: 'Flash',
    version: '2.5',
    modelString: 'gemini-2.5-flash',
    shortName: 'Flash',
    thinkingCapable: true,
    thinking: true
  },
  imageEditor: {
    name: 'Image Editor',
    version: '2.5',
    modelString: 'gemini-2.5-flash-image-preview',
    shortName: 'Image Editor',
    thinkingCapable: false,
    thinking: false,
    imageOutput: true
  }
}
