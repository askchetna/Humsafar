import { useEffect } from "react"

export default function useSocket(
    socketService,
    events = {}
) {

    useEffect(() => {

        Object.entries(events).forEach(
            ([event, handler]) => {

                socketService.on(
                    event,
                    handler
                )
            }
        )

        return () => {

            Object.keys(events).forEach(
                (event) => {

                    socketService.off(event)
                }
            )
        }

    }, [])
}