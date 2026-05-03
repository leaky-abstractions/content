import { makeScene2D, Txt } from '@motion-canvas/2d';
import { createRef, waitFor } from '@motion-canvas/core';

export default makeScene2D(function* (view) {
    const title = createRef<Txt>();

    view.add(<Txt ref={title} text="Firmament" fill="#F8FAFC" fontSize={64} fontFamily="JetBrains Mono" />);

    yield* waitFor(2);
});
