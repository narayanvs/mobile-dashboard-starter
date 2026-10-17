
const quiet=Base=>class extends Base{_build(){super._build();const style=document.createElement('style');style.textContent=`.settings-note{display:none!important}
`;this.shadowRoot.append(style);}};
customElements.define('mds-quiet-live-v27',quiet(customElements.get('mds-comet-live-v26')));
customElements.define('mds-quiet-test-v27',quiet(customElements.get('mds-comet-test-v26')));
