export function HaikuTable({
  haikus,
}: {
  haikus: { talk_id: number; haijin_name: string; haiku: string }[];
}) {
  if (haikus.length === 0) {
    return (
      <p className="text-center text-gray-600 text-xs-responsive">
        該当する投句はありません。
      </p>
    );
  }

  return (
    <table className="min-w-full bg-white border border-gray-300 text-xs-responsive">
      <thead>
        <tr>
          <th className="py-2 px-4 border-b text-right">番号</th>
          <th className="py-2 px-4 border-b">詠み人・句</th>
        </tr>
      </thead>
      <tbody>
        {haikus.map((haiku, index) => (
          <tr
            key={haiku.talk_id}
            className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
          >
            <td className="py-2 px-4 border-b text-right">{haiku.talk_id}</td>
            <td className="py-2 px-4 border-b">
              <div>{haiku.haijin_name}</div>
              <div className="text-gray-600">{haiku.haiku}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
