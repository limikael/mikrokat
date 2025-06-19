export async function testDatabaseService(service) {
	await service.exec("create table test (id integer not null primary key, value integer); insert into test (value) values (1),(2),(3)");

	let all=await service.prepare("select * from test").all()
	expect(all.results).toEqual([ { id: 1, value: 1 }, { id: 2, value: 2 }, { id: 3, value: 3 } ]);

	let all2=await service.prepare("select * from test").run()
	expect(all2.results).toEqual(null);

	//let all3=await (await service.prepare("insert into test (value) values (4)")).run()
	let all3=await service.prepare("insert into test (value) values (4)").all()
	expect(all3.meta.changes).toEqual(1);
	expect(all3.meta.last_row_id).toEqual(4);

	let all4=await service.prepare("insert into test (value) values (?)").bind(5).all();
	expect(all4.meta.changes).toEqual(1);

	let all5=await service.prepare("select * from test where value=?").all(5);
	expect(all5.results.length).toEqual(1);

	let raw=await service.prepare("select * from test").raw();
	expect(raw).toEqual([ [ 1, 1 ], [ 2, 2 ], [ 3, 3 ], [ 4, 4 ], [ 5, 5 ] ]);

	let first=await service.prepare("select * from test").first();
	expect(first).toEqual({id: 1, value: 1});

	let q=service.prepare("select * from test where id=?");

	let batch=await service.batch([
		q.bind(1),
		q.bind(2)
	]);
	expect(batch).toEqual([{"success":true,"meta":{},"results":[{"id":1,"value":1}]},{"success":true,"meta":{},"results":[{"id":2,"value":2}]}]);
}