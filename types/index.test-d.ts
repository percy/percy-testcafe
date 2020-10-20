import { expectType, expectError } from 'tsd';
import percySnapshot from '.';

expectError(percySnapshot());

expectType<Promise<void>>(percySnapshot('Snapshot name'));
expectType<Promise<void>>(percySnapshot('Snapshot name', { widths: [1000] }));

expectError(percySnapshot('Snapshot name', { foo: 'bar' }));
